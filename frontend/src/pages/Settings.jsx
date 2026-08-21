import { useState, useEffect } from 'react';
import { useMail } from '../context/MailContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Globe, Mail, Users, Building, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import './Settings.css';

export default function Settings() {
  const { activeOrg, fetchOrgs, mailboxes, fetchMailboxes } = useMail();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  // Data states
  const [domains, setDomains] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (activeOrg) {
      if (activeTab === 'domains') loadDomains();
      if (activeTab === 'members') loadMembers();
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
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your organization's domains, mailboxes, and team members.</p>
      </div>

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
          </div>
          
          <div className="sidebar-group">
            <span className="group-label">TEAM</span>
            <button className={`nav-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
              <Users size={16} /> Members
            </button>
          </div>
        </div>

        <div className="settings-content">
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
                        <div style={{ marginTop: '16px', width: '100%', backgroundColor: 'rgba(24, 24, 27, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                          <p style={{ marginBottom: '12px', color: 'var(--text-main)', fontWeight: 500 }}>Please add the following DNS records to your domain provider to verify and use this domain:</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>TXT Record (Ownership Verification):</span>
                              <code style={{ display: 'block', padding: '8px', background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', marginTop: '4px', wordBreak: 'break-all' }}>
                                Name: _graxion.{d.domain} &nbsp;&nbsp;&nbsp; Value: {d.verification?.token}
                              </code>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>MX Record (Receive Email):</span>
                              <code style={{ display: 'block', padding: '8px', background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', marginTop: '4px', wordBreak: 'break-all' }}>
                                Name: {d.domain} &nbsp;&nbsp;&nbsp; Value: mx.graxion.in &nbsp;&nbsp;&nbsp; Priority: 10
                              </code>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-muted)' }}>TXT Record (SPF / Deliverability):</span>
                              <code style={{ display: 'block', padding: '8px', background: '#09090b', border: '1px solid #27272a', borderRadius: '6px', marginTop: '4px', wordBreak: 'break-all' }}>
                                Name: {d.domain} &nbsp;&nbsp;&nbsp; Value: v=spf1 include:spf.graxion.in ~all
                              </code>
                            </div>
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
                      </div>
                    </div>
                  ))}
                  {mailboxes.length === 0 && <div className="empty-state">No mailboxes created.</div>}
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
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="settings-section animate-fade-in">
              <div className="section-header-flex">
                <h2>Team Members</h2>
              </div>
              
              <div className="settings-card">
                <form onSubmit={handleInviteMember} className="add-inline-form">
                  <input 
                    type="email" 
                    placeholder="colleague@company.com" 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                  />
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="role-select">
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="support_agent">Support Agent</option>
                    <option value="member">Member</option>
                  </select>
                  <button type="submit" className="btn-secondary" disabled={loading || !inviteEmail}>
                    Invite
                  </button>
                </form>
                
                <div className="list-container">
                  {members.map(m => (
                    <div key={m._id} className="list-item">
                      <div className="item-info">
                        <strong>{m.invitedEmail}</strong>
                        <span className={`status-badge ${m.status === 'active' ? 'success' : 'pending'}`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="item-actions">
                        <select 
                          className="role-badge" 
                          style={{border: 'none', outline: 'none', cursor: 'pointer', appearance: 'auto'}}
                          value={m.role}
                          onChange={(e) => handleUpdateRole(m._id, e.target.value)}
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="support_agent">Support Agent</option>
                          <option value="member">Member</option>
                        </select>
                        <button className="btn-icon text-red"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                  {members.length === 0 && <div className="empty-state">No members found.</div>}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
