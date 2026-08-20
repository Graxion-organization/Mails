import { useState } from 'react';
import { useMail } from '../../context/MailContext';
import { X, Minus, Maximize2, Paperclip, Send, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export default function Composer() {
  const { closeComposer, activeOrg, activeMailbox, composerInitialData } = useMail();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [to, setTo] = useState(composerInitialData?.to || '');
  const [subject, setSubject] = useState(composerInitialData?.subject || '');
  const [body, setBody] = useState(composerInitialData?.body || '');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!to) return toast.error('Please specify a recipient');
    
    setIsSending(true);
    try {
      const recipients = to.split(',').map(email => email.trim()).filter(Boolean);
      
      if (composerInitialData?.type === 'reply') {
        await api.post('/mail/reply', {
          organizationId: activeOrg?._id,
          mailboxId: activeMailbox?._id,
          messageId: composerInitialData.messageId,
          to: recipients,
          bodyText: body,
          bodyHtml: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
        });
      } else {
        await api.post('/mail/send', {
          organizationId: activeOrg?._id,
          mailboxId: activeMailbox?._id,
          to: recipients,
          subject,
          bodyText: body,
          bodyHtml: `<p>${body.replace(/\n/g, '<br/>')}</p>`,
        });
      }
      
      toast.success('Email sent!');
      closeComposer();
    } catch (error) {
      console.error('Send error:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  if (isMinimized) {
    return (
      <div style={styles.minimizedContainer} onClick={() => setIsMinimized(false)}>
        <div style={styles.header}>
          <span>New Message</span>
          <div style={styles.actions}>
            <button onClick={(e) => { e.stopPropagation(); closeComposer(); }}><X size={16} /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{...styles.container, ...(isFullScreen ? styles.fullScreen : {})}} className="animate-slide-up">
      <div style={styles.header}>
        <div style={styles.headerTitle}>New Message</div>
        <div style={styles.actions}>
          <button onClick={() => setIsMinimized(true)} style={styles.actionBtn}><Minus size={16} /></button>
          <button onClick={() => setIsFullScreen(!isFullScreen)} style={styles.actionBtn}><Maximize2 size={16} /></button>
          <button onClick={closeComposer} style={styles.actionBtn}><X size={16} /></button>
        </div>
      </div>
      
      <div style={styles.body}>
        <div style={styles.inputRow}>
          <span style={styles.label}>To</span>
          <input 
            style={styles.input} 
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
          />
        </div>
        
        <div style={styles.inputRow}>
          <input 
            style={styles.subjectInput} 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </div>
        
        <textarea 
          style={styles.editor} 
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      
      <div style={styles.footer}>
        <div style={styles.footerLeft}>
          <div style={styles.sendGroup}>
            <button 
              className="btn btn-primary" 
              style={styles.sendBtn} 
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
            <button className="btn btn-primary" style={styles.scheduleBtn}>
              <Clock size={16} />
            </button>
          </div>
          <button style={styles.toolBtn}><Paperclip size={18} /></button>
        </div>
        <div style={styles.footerRight}>
          <button style={styles.toolBtn} onClick={closeComposer}><Trash2 size={18} /></button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: 0,
    right: '80px',
    width: '560px',
    height: '600px',
    backgroundColor: 'var(--bg-main)',
    border: '1px solid var(--border-color)',
    borderBottom: 'none',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 -10px 40px rgba(0,0,0,0.4)',
    zIndex: 100,
  },
  fullScreen: {
    top: '40px',
    bottom: '40px',
    right: '80px',
    left: '80px',
    width: 'auto',
    height: 'auto',
    borderRadius: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  minimizedContainer: {
    position: 'fixed',
    bottom: 0,
    right: '80px',
    width: '260px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderBottom: 'none',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    cursor: 'pointer',
    zIndex: 100,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: 'var(--bg-surface)',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  headerTitle: {
    fontSize: '14px',
    fontWeight: '500',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  actionBtn: {
    color: 'var(--text-muted)',
    padding: '4px',
    borderRadius: '4px',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-color)',
    padding: '4px 16px',
  },
  label: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    width: '40px',
  },
  input: {
    flex: 1,
    background: 'none',
    border: 'none',
    color: 'var(--text-main)',
    padding: '8px 0',
    outline: 'none',
    fontSize: '14px',
  },
  subjectInput: {
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--text-main)',
    padding: '12px 0',
    outline: 'none',
    fontSize: '14px',
    fontWeight: '500',
  },
  editor: {
    flex: 1,
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--text-main)',
    padding: '16px',
    outline: 'none',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderTop: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-main)',
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  sendGroup: {
    display: 'flex',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  sendBtn: {
    borderRadius: 0,
    padding: '8px 24px',
  },
  scheduleBtn: {
    borderRadius: 0,
    borderLeft: '1px solid rgba(0,0,0,0.2)',
    padding: '8px 12px',
  },
  footerRight: {
    display: 'flex',
  },
  toolBtn: {
    color: 'var(--text-muted)',
    padding: '8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
