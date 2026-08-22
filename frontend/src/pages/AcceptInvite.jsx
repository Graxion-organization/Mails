import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('inviteToken');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invitation link. No token provided.');
    }
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      setStatus('loading');
      const res = await api.post('/orgs/accept-invite', { token });
      if (res.data.success) {
        setStatus('success');
        toast.success(res.data.message || 'Invitation accepted successfully!');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.message || 'Failed to accept invitation. It may have expired or been revoked.');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fff', padding: '20px' }}>
      <div style={{ background: '#18181b', border: '1px solid #27272a', padding: '40px', borderRadius: '12px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        {status === 'idle' && (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '16px' }}>Organization Invitation</h2>
            <p style={{ color: '#a1a1aa', marginBottom: '32px' }}>
              You have been invited to join an organization on Graxion Mail. Click the button below to accept the invitation.
            </p>
            <button 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              onClick={handleAccept}
            >
              Accept Invitation
            </button>
          </>
        )}

        {status === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <Loader2 className="animate-spin" size={48} color="#a855f7" />
            <p style={{ color: '#a1a1aa' }}>Processing your invitation...</p>
          </div>
        )}

        {status === 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <CheckCircle2 size={48} color="#10b981" />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#10b981' }}>Invitation Accepted!</h2>
            <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
              Your acceptance has been recorded. You are now waiting for the organization administrator to approve your access.
            </p>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/inbox')}
            >
              Go to Inbox
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <XCircle size={48} color="#ef4444" />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#ef4444' }}>Invitation Failed</h2>
            <p style={{ color: '#a1a1aa', marginBottom: '16px' }}>
              {errorMessage}
            </p>
            <button 
              className="btn-secondary" 
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate('/')}
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
