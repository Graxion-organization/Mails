import { useState, useEffect } from 'react';
import { useMail } from '../context/MailContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Globe, Mail, Users, Building, Plus, Trash2, Loader2, CheckCircle2, Copy, Info, Tag, Lock } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { activeOrg, fetchOrgs, mailboxes, fetchMailboxes } = useMail();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  // Data states
  const [domains, setDomains] = useState([]);
  const [members, setMembers] = useState([]);
  
  // App Lock state
  const [pin, setPin] = useState('');
  const [isLockEnabled, setIsLockEnabled] = useState(localStorage.getItem('graxion_mail_lock_enabled') === 'true');

  // Labels state inside Settings
  const { labels, fetchLabels } = useMail();
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#8b5cf6');

  useEffect(() => {
    if (activeOrg) {
      if (activeTab === 'domains') loadDomains();
      if (activeTab === 'members') loadMembers();
      if (activeTab === 'labels') fetchLabels(activeOrg._id);
    }
  }, [activeOrg, activeTab]);

  const loadDomains = async () => {
    try {
      const res = await api.get(`/orgs/${activeOrg._id}/domains`);
      if (res.data.success) setDomains(res.data.data);
    } catch (error) {
      toast.error('Failed to load domains');
    }
  };

  const loadMembers = async () => {
    try {
      const res = await api.get(`/orgs/${activeOrg._id}/members`);
      if (res.data.success) setMembers(res.data.data);
    } catch (error) {
      toast.error('Failed to load members');
    }
  };

  // Organization Tab
  const [orgData, setOrgData] = useState({ name: activeOrg?.name || '', description: activeOrg?.description || '' });
  
  useEffect(() => {
    if (activeOrg) {
      setOrgData({ name: activeOrg.name, description: activeOrg.description || '' });
    }
  }, [activeOrg]);

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put(`/orgs/${activeOrg._id}`, orgData);
      if (res.data.success) {
        toast.success('Organization updated');
        fetchOrgs();
      }
    } catch (error) {
      toast.error('Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  // Domains Tab
  const [newDomain, setNewDomain] = useState('');
  
  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!newDomain) return;
    try {
      setLoading(true);
      const res = await api.post(`/orgs/${activeOrg._id}/domains`, { domain: newDomain });
      if (res.data.success) {
        toast.success('Domain added successfully. Please verify DNS records.');
        setNewDomain('');
        loadDomains();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async (domainId) => {
    try {
      setLoading(true);
      const res = await api.post(`/orgs/${activeOrg._id}/domains/${domainId}/verify`);
      if (res.data.success) {
        toast.success('Domain verified successfully!');
        loadDomains();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Domain verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleRemoveDomain = async (domainId) => {
    if (!window.confirm('Are you sure you want to remove this domain?')) return;
    try {
      setLoading(true);
      const res = await api.delete(`/orgs/${activeOrg._id}/domains/${domainId}`);
      if (res.data.success) {
        toast.success('Domain removed successfully');
        loadDomains();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove domain');
    } finally {
      setLoading(false);
    }
  };

  // Mailboxes Tab
  const [showMailboxModal, setShowMailboxModal] = useState(false);
  const [newMailbox, setNewMailbox] = useState({ localPart: '', domainId: '', displayName: '' });

  const handleCreateMailbox = async (e) => {
    e.preventDefault();
    if (!newMailbox.localPart || !newMailbox.domainId) return toast.error('Address and domain required');
    try {
      setLoading(true);
      const res = await api.post(`/orgs/${activeOrg._id}/mailboxes`, newMailbox);
      if (res.data.success) {
        toast.success('Mailbox created');
        setShowMailboxModal(false);
        setNewMailbox({ localPart: '', domainId: '', displayName: '' });
        fetchMailboxes(activeOrg._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create mailbox');
    } finally {
      setLoading(false);
    }
  };

  const [editMailbox, setEditMailbox] = useState(null);

  const handleUpdateMailbox = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put(`/orgs/${activeOrg._id}/mailboxes/${editMailbox._id}`, {
        displayName: editMailbox.displayName,
      });
      if (res.data.success) {
        toast.success('Mailbox updated successfully');
        setEditMailbox(null);
        fetchMailboxes(activeOrg._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update mailbox');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMailbox = async (mailboxId) => {
    if (!window.confirm('Are you sure you want to deactivate this mailbox?')) return;
    try {
      setLoading(true);
      const res = await api.delete(`/orgs/${activeOrg._id}/mailboxes/${mailboxId}`);
      if (res.data.success) {
        toast.success('Mailbox deactivated');
        fetchMailboxes(activeOrg._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete mailbox');
    } finally {
      setLoading(false);
    }
  };

  // Members Tab
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    try {
      setLoading(true);
      const res = await api.post(`/orgs/${activeOrg._id}/members/invite`, { email: inviteEmail, role: inviteRole });
      if (res.data.success) {
        toast.success('Invitation sent');
        setInviteEmail('');
        loadMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      setLoading(true);
      const res = await api.put(`/orgs/${activeOrg._id}/members/${memberId}`, { role: newRole });
      if (res.data.success) {
        toast.success('Role updated');
        loadMembers();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  if (!activeOrg) return null;

  return (
    <div className="settings-container">
      <div className="settings-layout">
        <div className="settings-sidebar">
          <div className="sidebar-group">
            <span className="group-label">WORKSPACE</span>
            <button className={`nav-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
              <Building size={16} /> General
            </button>
            <button className={`nav-btn ${activeTab === 'domains' ? 'active' : ''}`} onClick={() => setActiveTab('domains')}>
              <Globe size={16} /> Domains
            </button>
          </div>
          
          <div className="sidebar-group">
            <span className="group-label">EMAIL</span>
            <button className={`nav-btn ${activeTab === 'mailboxes' ? 'active' : ''}`} onClick={() => setActiveTab('mailboxes')}>
              <Mail size={16} /> Mailboxes
            </button>
            <button className={`nav-btn ${activeTab === 'labels' ? 'active' : ''}`} onClick={() => setActiveTab('labels')}>
              <Tag size={16} /> Labels
            </button>
          </div>
          
          <div className="sidebar-group">
            <span className="group-label">TEAM</span>
            <button className={`nav-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
              <Users size={16} /> Members
            </button>
          </div>

          <div className="sidebar-group">
            <span className="group-label">SECURITY</span>
            <button className={`nav-btn ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
              <Lock size={16} /> App Lock
            </button>
          </div>
        </div>

        <div className="settings-content">
          <div className="settings-header">
            <h1>Settings</h1>
            <p>Manage your organization's domains, mailboxes, and team members.</p>
          </div>

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="settings-section animate-fade-in">
              <h2>Organization Profile</h2>
              <div className="settings-card">
                <form onSubmit={handleUpdateOrg}>
                  <div className="form-group">
                    <label>Organization Name</label>
                    <input 
                      type="text" 
                      value={orgData.name} 
                      onChange={e => setOrgData({...orgData, name: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input 
                      type="text" 
                      value={orgData.description} 
                      onChange={e => setOrgData({...orgData, description: e.target.value})} 
                    />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* DOMAINS TAB */}
          {activeTab === 'domains' && (
            <div className="settings-section animate-fade-in">
              <div className="section-header-flex">
                <h2>Domains</h2>
              </div>
              
              <div className="settings-card">
                <div className="list-container">
                  {domains.map(d => (
                    <div key={d._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div className="item-info" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '15px' }}>{d.domain}</strong>
                          <span className={`status-badge ${d.status === 'verified' ? 'success' : 'pending'}`} style={{ marginLeft: '12px' }}>
                            {d.status === 'verified' ? <CheckCircle2 size={12} /> : null}
                            {d.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="item-actions">
                          {d.status !== 'verified' && (
                            <button className="btn-secondary" onClick={() => handleVerifyDomain(d._id)} disabled={loading}>
                              Verify
                            </button>
                          )}
                          <button className="btn-icon" onClick={() => handleRemoveDomain(d._id)} title="Remove Domain"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      
                      {d.status !== 'verified' && (
                        <div className="dns-instructions-block">
                          <div className="dns-title">Please add these DNS records to your domain provider to verify ownership and enable email delivery:</div>
                          
                          <div className="dns-table-container">
                            <table className="dns-table">
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th>Name / Host</th>
                                  <th>Value</th>
                                  <th>Priority</th>
                                  <th>Proxy Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td data-label="Type"><span className="dns-type">TXT</span></td>
                                  <td data-label="Name / Host">
                                    <div className="dns-copyable">
                                      <span>_graxion.{d.domain}</span>
                                      <button onClick={() => handleCopy(`_graxion.${d.domain}`)} title="Copy"><Copy size={12}/></button>
                                    </div>
                                  </td>
                                  <td data-label="Value">
                                    <div className="dns-copyable">
                                      <span className="truncate-value" title={d.verification?.token}>{d.verification?.token}</span>
                                      <button onClick={() => handleCopy(d.verification?.token)} title="Copy"><Copy size={12}/></button>
                                    </div>
                                  </td>
                                  <td data-label="Priority">-</td>
                                  <td data-label="Proxy Status">DNS Only</td>
                                </tr>
                                
                                <tr>
                                  <td data-label="Type"><span className="dns-type">MX</span></td>
                                  <td data-label="Name / Host">
                                    <div className="dns-copyable">
                                      <span>{d.domain}</span>
                                      <button onClick={() => handleCopy(d.domain)} title="Copy"><Copy size={12}/></button>
                                    </div>
                                  </td>
                                  <td data-label="Value">
                                    <div className="dns-copyable">
                                      <span>mx.graxion.in</span>
                                      <button onClick={() => handleCopy('mx.graxion.in')} title="Copy"><Copy size={12}/></button>
                                    </div>
                                  </td>
                                  <td data-label="Priority">10</td>
                                  <td data-label="Proxy Status">DNS Only</td>
                                </tr>

                                <tr>
                                  <td data-label="Type"><span className="dns-type">TXT</span></td>
                                  <td data-label="Name / Host">
                                    <div className="dns-copyable">
                                      <span>{d.domain}</span>
                                      <button onClick={() => handleCopy(d.domain)} title="Copy"><Copy size={12}/></button>
                                    </div>
                                  </td>
                                  <td data-label="Value">
                                    <div className="dns-copyable">
                                      <span>v=spf1 include:spf.graxion.in ~all</span>
                                      <button onClick={() => handleCopy('v=spf1 include:spf.graxion.in ~all')} title="Copy"><Copy size={12}/></button>
                                    </div>
                                  </td>
                                  <td data-label="Priority">-</td>
                                  <td data-label="Proxy Status">DNS Only</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          <div className="dns-note">
                            <Info size={14} /> DNS propagation may take up to 24-48 hours, though usually happens within minutes.
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {domains.length === 0 && <div className="empty-state">No domains configured.</div>}
                </div>
                
                <form onSubmit={handleAddDomain} className="add-inline-form">
                  <input 
                    type="text" 
                    placeholder="e.g. acme.com" 
                    value={newDomain} 
                    onChange={e => setNewDomain(e.target.value)} 
                  />
                  <button type="submit" className="btn-secondary" disabled={loading || !newDomain}>
                    <Plus size={16} /> Add Domain
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* MAILBOXES TAB */}
          {activeTab === 'mailboxes' && (
            <div className="settings-section animate-fade-in">
              <div className="section-header-flex">
                <h2>Shared Mailboxes</h2>
                <button className="btn-primary" onClick={() => setShowMailboxModal(true)}>
                  <Plus size={16} /> New Mailbox
                </button>
              </div>
              
              <div className="settings-card no-padding">
                <div className="list-container">
                  {mailboxes.map(m => (
                    <div key={m._id} className="list-item">
                      <div className="item-info">
                        <strong>{m.address}</strong>
                        <span className="sub-text">{m.displayName}</span>
                      </div>
                      <div className="item-actions">
                        <span className="pill">Shared</span>
                        <button className="btn-icon" onClick={() => setEditMailbox(m)} title="Edit Mailbox"><SettingsIcon size={16} /></button>
                        <button className="btn-icon" onClick={() => handleDeleteMailbox(m._id)} title="Delete Mailbox"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {mailboxes.length === 0 && <div className="empty-state">No mailboxes created.</div>}
                </div>
              </div>
              

            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="settings-section animate-fade-in">
              <div className="section-header-flex">
                <h2>Team Members</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address"
                    className="form-input flex-1 sm:w-64"
                  />
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="form-input w-24 sm:w-32"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button className="btn-primary" onClick={handleInviteMember} disabled={loading || !inviteEmail}>
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                    <span className="hidden sm:inline">Invite</span>
                  </button>
                </div>
              </div>
              <div className="settings-card no-padding">
                <div className="data-table">
                  {members.map(member => (
                    <div key={member._id} className="table-row">
                      <div className="col-info">
                        <strong>{member.account?.name || member.email}</strong>
                        <span className="text-secondary">{member.email}</span>
                      </div>
                      <div className="col-action">
                        <select 
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member._id, e.target.value)}
                          className="role-select"
                        >
                          <option value="owner" disabled>Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && <div className="empty-state">No members found.</div>}
                </div>
              </div>
            </div>
          )}

          {/* LABELS TAB */}
          {activeTab === 'labels' && (
            <div className="settings-section animate-fade-in">
              <div className="section-header-flex">
                <h2>Custom Labels</h2>
              </div>
              
              <div className="settings-card mb-6">
                <h3 className="mb-4 text-[14px] font-medium">Create New Label</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Label Name (e.g. Invoices)"
                    className="form-input flex-1"
                  />
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <button 
                      className="btn-primary" 
                      onClick={async () => {
                        if (!newLabelName) return;
                        try {
                          const res = await api.post('/mail/labels', {
                            orgId: activeOrg._id,
                            name: newLabelName,
                            color: newLabelColor
                          });
                          if (res.data.success) {
                            toast.success('Label created');
                            setNewLabelName('');
                            fetchLabels(activeOrg._id);
                          }
                        } catch (error) {
                          toast.error('Error creating label');
                        }
                      }}
                    >
                      <Plus size={16} /> Create
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-card no-padding">
                <div className="data-table">
                  {labels.map(label => (
                    <div key={label._id} className="table-row">
                      <div className="col-info flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                        <strong>{label.name}</strong>
                      </div>
                      <div className="col-action">
                        <button 
                          className="btn-icon text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          onClick={async () => {
                            if (window.confirm('Delete this label?')) {
                              try {
                                await api.delete(`/mail/labels/${label._id}?orgId=${activeOrg._id}`);
                                toast.success('Label deleted');
                                fetchLabels(activeOrg._id);
                              } catch(error) {
                                toast.error('Error deleting label');
                              }
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {labels.length === 0 && (
                    <div className="p-6 text-center text-secondary text-sm">
                      No custom labels created yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="settings-section animate-fade-in">
              <h2>App Lock (Local Device)</h2>
              <div className="settings-card">
                <p className="text-secondary text-sm mb-6">
                  Secure your Graxion Mail application on this device. You will need to enter a PIN or use your fingerprint to access your emails.
                </p>

                {!isLockEnabled ? (
                  <div className="flex flex-col gap-4 max-w-sm">
                    <label className="text-sm font-medium">Set a 4-6 digit PIN</label>
                    <input 
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="form-input text-center tracking-widest text-lg"
                      placeholder="••••"
                      maxLength={6}
                    />
                    <button 
                      className="btn-primary justify-center"
                      disabled={pin.length < 4}
                      onClick={() => {
                        localStorage.setItem('graxion_mail_pin', pin);
                        localStorage.setItem('graxion_mail_lock_enabled', 'true');
                        setIsLockEnabled(true);
                        setPin('');
                        toast.success('App Lock enabled with PIN');
                      }}
                    >
                      <Lock size={16} /> Enable App Lock
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 text-green-400 bg-green-400/10 p-4 rounded-xl">
                      <Lock size={20} />
                      <span className="font-medium">App Lock is currently enabled</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <button 
                        className="btn-secondary"
                        onClick={async () => {
                          try {
                            if (!window.PublicKeyCredential) {
                              toast.error('WebAuthn not supported on this browser');
                              return;
                            }
                            const challenge = new Uint8Array(32);
                            window.crypto.getRandomValues(challenge);
                            const credential = await navigator.credentials.create({
                              publicKey: {
                                challenge,
                                rp: { name: 'Graxion Mail' },
                                user: {
                                  id: new Uint8Array(16),
                                  name: activeOrg.name,
                                  displayName: 'Graxion User'
                                },
                                pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
                                authenticatorSelection: { userVerification: 'required' },
                              }
                            });
                            if (credential) {
                              const rawId = Array.from(new Uint8Array(credential.rawId));
                              localStorage.setItem('graxion_biometric_id', JSON.stringify(rawId));
                              toast.success('Biometric unlock enabled!');
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error('Failed to register biometrics');
                          }
                        }}
                      >
                        Setup Fingerprint/Biometrics
                      </button>

                      <button 
                        className="btn-secondary text-red-400 hover:text-red-300 border-red-400/20"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to disable the App Lock?')) {
                            localStorage.removeItem('graxion_mail_pin');
                            localStorage.removeItem('graxion_mail_lock_enabled');
                            localStorage.removeItem('graxion_biometric_id');
                            setIsLockEnabled(false);
                            toast.success('App Lock disabled');
                          }
                        }}
                      >
                        Disable App Lock
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {showMailboxModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Mailbox</h3>
            <form onSubmit={handleCreateMailbox}>
              <div className="form-group">
                <label>Address</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    placeholder="support"
                    value={newMailbox.localPart}
                    onChange={e => setNewMailbox({...newMailbox, localPart: e.target.value})}
                  />
                  <span className="input-separator">@</span>
                  <select 
                    value={newMailbox.domainId}
                    onChange={e => setNewMailbox({...newMailbox, domainId: e.target.value})}
                  >
                    <option value="">Select Domain</option>
                    {domains.filter(d => d.status === 'verified').map(d => (
                      <option key={d._id} value={d._id}>{d.domain}</option>
                    ))}
                    {domains.filter(d => d.status === 'verified').length === 0 && (
                      <option value="" disabled>No verified domains available</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Display Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Support Team"
                  value={newMailbox.displayName}
                  onChange={e => setNewMailbox({...newMailbox, displayName: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowMailboxModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editMailbox && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Mailbox</h3>
            <form onSubmit={handleUpdateMailbox}>
              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text" 
                  value={editMailbox.address}
                  disabled
                  style={{ opacity: 0.5 }}
                />
              </div>
              <div className="form-group">
                <label>Display Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Support Team"
                  value={editMailbox.displayName || ''}
                  onChange={e => setEditMailbox({...editMailbox, displayName: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={() => setEditMailbox(null)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
