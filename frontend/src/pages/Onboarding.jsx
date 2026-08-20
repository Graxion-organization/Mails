import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMail } from '../context/MailContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Loader2, Building, Globe, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import './Onboarding.css';

export default function Onboarding() {
  const { user } = useAuth();
  const { fetchOrgs, fetchMailboxes } = useMail();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form states
  const [orgData, setOrgData] = useState({ name: '', description: '' });
  const [createdOrg, setCreatedOrg] = useState(null);
  
  const [domainData, setDomainData] = useState({ domain: '' });
  const [createdDomain, setCreatedDomain] = useState(null);
  
  const [mailboxData, setMailboxData] = useState({ localPart: '', displayName: '' });

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!orgData.name) return toast.error('Organization name is required');
    
    try {
      setLoading(true);
      const res = await api.post('/orgs', orgData);
      if (res.data.success) {
        setCreatedOrg(res.data.data);
        toast.success('Organization created!');
        setStep(2);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!domainData.domain) return toast.error('Domain is required');
    
    try {
      setLoading(true);
      // 1. Add Domain
      const addRes = await api.post(`/orgs/${createdOrg._id}/domains`, domainData);
      if (addRes.data.success) {
        const domainId = addRes.data.data.domain._id;
        
        // 2. Automatically verify domain for development purposes
        const verifyRes = await api.post(`/orgs/${createdOrg._id}/domains/${domainId}/verify`);
        if (verifyRes.data.success) {
          setCreatedDomain(verifyRes.data.data);
          toast.success('Domain added and verified!');
          setStep(3);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMailbox = async (e) => {
    e.preventDefault();
    if (!mailboxData.localPart) return toast.error('Mailbox address is required');
    
    try {
      setLoading(true);
      const res = await api.post(`/orgs/${createdOrg._id}/mailboxes`, {
        localPart: mailboxData.localPart,
        displayName: mailboxData.displayName,
        domainId: createdDomain._id,
      });
      
      if (res.data.success) {
        toast.success('Mailbox created successfully!');
        
        // Refresh context data
        await fetchOrgs();
        await fetchMailboxes(createdOrg._id);
        
        // Navigate to inbox
        navigate('/inbox');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create mailbox');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-layout">
      <div className="onboarding-sidebar">
        <div className="onboarding-brand">Graxion Mail</div>
        
        <div className="step-indicator">
          <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 1 ? <CheckCircle2 size={18} /> : <span>1</span>}
            </div>
            <div className="step-content">
              <h4>Organization</h4>
              <p>Set up your workspace</p>
            </div>
          </div>
          
          <div className="step-connector"></div>
          
          <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 2 ? <CheckCircle2 size={18} /> : <span>2</span>}
            </div>
            <div className="step-content">
              <h4>Domain</h4>
              <p>Connect your domain</p>
            </div>
          </div>
          
          <div className="step-connector"></div>
          
          <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
            <div className="step-icon">
              {step > 3 ? <CheckCircle2 size={18} /> : <span>3</span>}
            </div>
            <div className="step-content">
              <h4>Mailbox</h4>
              <p>Create your first shared inbox</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="onboarding-main">
        <div className="onboarding-container">
          
          {step === 1 && (
            <div className="step-panel animate-fade-in">
              <div className="step-header">
                <div className="icon-badge"><Building size={24} color="#a855f7" /></div>
                <h2>Create your Organization</h2>
                <p>This is your team's workspace where all your domains, mailboxes, and members will live.</p>
              </div>
              
              <form onSubmit={handleCreateOrg}>
                <div className="form-group">
                  <label>Organization Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Corp" 
                    value={orgData.name}
                    onChange={e => setOrgData({...orgData, name: e.target.value})}
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label>Description (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Software Development" 
                    value={orgData.description}
                    onChange={e => setOrgData({...orgData, description: e.target.value})}
                  />
                </div>
                
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Continue'} <ArrowRight size={16} />
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="step-panel animate-fade-in">
              <div className="step-header">
                <div className="icon-badge"><Globe size={24} color="#3b82f6" /></div>
                <h2>Connect your Domain</h2>
                <p>Add the domain you want to send and receive emails from. For development, we'll verify this automatically.</p>
              </div>
              
              <form onSubmit={handleAddDomain}>
                <div className="form-group">
                  <label>Domain Name</label>
                  <div className="input-with-prefix">
                    <span className="prefix">www.</span>
                    <input 
                      type="text" 
                      placeholder="acme.com" 
                      value={domainData.domain}
                      onChange={e => setDomainData({domain: e.target.value})}
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="info-box">
                  <p>In a production environment, you would be provided with DNS records (TXT, MX, SPF) to add to your domain registrar. For this development environment, the domain will be instantly verified.</p>
                </div>
                
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Add Domain'} <ArrowRight size={16} />
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="step-panel animate-fade-in">
              <div className="step-header">
                <div className="icon-badge"><Mail size={24} color="#10b981" /></div>
                <h2>Create your First Mailbox</h2>
                <p>Create a shared inbox for your team (like support@ or sales@) using your newly verified domain.</p>
              </div>
              
              <form onSubmit={handleCreateMailbox}>
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="email-input-group">
                    <input 
                      type="text" 
                      placeholder="support" 
                      value={mailboxData.localPart}
                      onChange={e => setMailboxData({...mailboxData, localPart: e.target.value})}
                      autoFocus
                    />
                    <span className="domain-suffix">@{createdDomain?.domain}</span>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Display Name (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Acme Support" 
                    value={mailboxData.displayName}
                    onChange={e => setMailboxData({...mailboxData, displayName: e.target.value})}
                  />
                </div>
                
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : 'Complete Setup'} <CheckCircle2 size={16} />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
