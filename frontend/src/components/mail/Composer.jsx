import { useState, useRef, useEffect } from 'react';
import { useMail } from '../../context/MailContext';
import { X, Minus, Maximize2, Paperclip, Send, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function Composer() {
  const { closeComposer, activeOrg, activeMailbox, composerInitialData } = useMail();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [to, setTo] = useState(composerInitialData?.to || '');
  const [subject, setSubject] = useState(composerInitialData?.subject || '');
  const [body, setBody] = useState(composerInitialData?.body || '');
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [showScheduleInput, setShowScheduleInput] = useState(false);
  const fileInputRef = useRef(null);
  const draftTimer = useRef(null);
  
  // Load local draft on mount if not replying
  useEffect(() => {
    if (!composerInitialData?.type) {
      const localDraft = localStorage.getItem('graxion_offline_draft');
      if (localDraft) {
        try {
          const parsed = JSON.parse(localDraft);
          if (parsed.to) setTo(parsed.to);
          if (parsed.subject) setSubject(parsed.subject);
          if (parsed.body) setBody(parsed.body);
        } catch (e) {}
      }
    }
  }, [composerInitialData]);

  // Auto-draft logic
  useEffect(() => {
    const isEmpty = !to && !subject && (!body || body === '<p><br></p>' || body === '');
    if (isEmpty || isSending) return;

    if (draftTimer.current) clearTimeout(draftTimer.current);

    draftTimer.current = setTimeout(async () => {
      const payload = {
        organizationId: activeOrg?._id,
        mailboxId: activeMailbox?._id,
        to: to.split(',').map(e => ({ email: e.trim() })).filter(e => e.email),
        subject,
        bodyHtml: body,
        bodyText: body.replace(/<[^>]+>/g, ''),
      };

      if (composerInitialData?.type === 'reply') {
        payload.inReplyTo = composerInitialData.messageId;
      }
      
      // Always save to localStorage as backup
      localStorage.setItem('graxion_offline_draft', JSON.stringify({ to, subject, body }));

      try {
        if (draftId) {
          await api.put(`/mail/drafts/${draftId}`, payload);
        } else {
          const res = await api.post('/mail/drafts', payload);
          if (res.data?.data?._id) {
            setDraftId(res.data.data._id);
          }
        }
      } catch (err) {
        console.error("Auto draft save error to cloud, saved locally", err);
      }
    }, 2500);

    return () => clearTimeout(draftTimer.current);
  }, [to, subject, body, activeOrg, activeMailbox, composerInitialData, draftId, isSending]);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const tempAttachments = newFiles.map(f => ({ name: f.name, uploading: true }));
      setAttachments(prev => [...prev, ...tempAttachments]);
      
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('orgId', activeOrg?._id);
        
        try {
          const res = await api.post('/mail/attachments/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          setAttachments(prev => {
            const updated = [...prev];
            const idx = updated.findIndex(a => a.name === file.name && a.uploading);
            if (idx !== -1) updated[idx] = res.data.data;
            return updated;
          });
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          setAttachments(prev => prev.filter(a => !(a.name === file.name && a.uploading)));
        }
      }
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!to) return toast.error('Please specify a recipient');
    if (attachments.some(a => a.uploading)) return toast.error('Please wait for attachments to finish uploading');
    
    setIsSending(true);
    try {
      const recipients = to.split(',').map(email => ({ email: email.trim() })).filter(e => e.email);
      const cleanBodyText = body.replace(/<[^>]+>/g, '');
      
      const payload = {
        organizationId: activeOrg?._id,
        mailboxId: activeMailbox?._id,
        to: recipients,
        bodyText: cleanBodyText,
        bodyHtml: body,
        attachments: attachments,
      };

      if (scheduledAt) {
        payload.scheduledAt = scheduledAt;
      }

      if (composerInitialData?.type === 'reply') {
        payload.messageId = composerInitialData.messageId;
        payload.replyAll = false;
        if (scheduledAt) {
          await api.post('/mail/schedule', payload);
        } else {
          await api.post('/mail/reply', payload);
        }
      } else {
        payload.subject = subject;
        if (scheduledAt) {
          await api.post('/mail/schedule', payload);
        } else {
          await api.post('/mail/send', payload);
        }
      }
      
      localStorage.removeItem('graxion_offline_draft');
      toast.success(scheduledAt ? 'Email scheduled!' : 'Email sent!');
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
      <div 
        className="fixed bottom-6 right-6 lg:right-10 w-[300px] h-[48px] bg-surface border border-white/10 rounded-t-xl flex items-center justify-between px-4 cursor-pointer shadow-2xl z-[100] hover:bg-surface-hover transition-colors" 
        onClick={() => setIsMinimized(false)}
      >
        <span className="text-[14px] font-medium text-main">New Message</span>
        <div className="flex items-center">
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-secondary hover:text-main transition-colors"
            onClick={(e) => { e.stopPropagation(); closeComposer(); }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed z-[100] bg-bg border border-white/10 flex flex-col shadow-2xl animate-slide-up 
      ${isFullScreen 
        ? 'inset-0 sm:inset-4 sm:rounded-xl' 
        : 'bottom-0 right-0 w-full h-[100dvh] sm:bottom-6 sm:right-6 lg:right-10 sm:w-[600px] sm:h-[550px] sm:rounded-xl rounded-t-xl'
      }`}>
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-white/5 sm:rounded-t-xl shrink-0">
        <div className="text-[14px] font-medium text-main">New Message</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 text-secondary hover:text-main transition-colors"><Minus size={16} /></button>
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="hidden sm:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-white/10 text-secondary hover:text-main transition-colors"><Maximize2 size={16} /></button>
          <button onClick={closeComposer} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-secondary hover:text-main transition-colors"><X size={16} /></button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-0 bg-bg">
        <div className="flex items-center px-4 py-2 border-b border-white/5">
          <span className="text-[14px] text-secondary w-12 shrink-0">To</span>
          <input 
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-main placeholder-secondary/50 py-1"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
          />
        </div>
        
        <div className="flex items-center px-4 py-2 border-b border-white/5">
          <input 
            className="w-full bg-transparent border-none outline-none text-[14px] font-medium text-main placeholder-secondary/50 py-1"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </div>
        
        <div className="flex-1 flex flex-col bg-white text-black overflow-y-auto">
          <style>{`
            .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #e5e7eb !important; }
            .ql-container.ql-snow { border: none !important; }
            .ql-editor { min-height: 200px; font-size: 14px; }
          `}</style>
          <ReactQuill 
            theme="snow"
            value={body}
            onChange={setBody}
            placeholder="Write something..."
            className="flex-1 flex flex-col"
          />
        </div>
        
        {/* Attachments rendering */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-white/5">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-surface border border-white/10 rounded-md px-3 py-1.5">
                <Paperclip size={14} className="text-secondary" />
                <span className="text-[12px] text-main max-w-[120px] truncate">{file.name}</span>
                <button 
                  className="text-secondary hover:text-danger ml-1" 
                  onClick={() => removeAttachment(idx)}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-t border-white/5 rounded-b-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-primary rounded-lg relative">
            <button 
              className="px-5 py-2 text-[14px] font-medium text-white hover:bg-white/10 transition-colors rounded-l-lg border-r border-white/20 disabled:opacity-50" 
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : (scheduledAt ? 'Schedule' : 'Send')}
            </button>
            <button 
              className="px-3 py-2 text-white hover:bg-white/10 transition-colors rounded-r-lg relative"
              onClick={() => setShowScheduleInput(!showScheduleInput)}
            >
              <Clock size={16} />
            </button>
            
            {showScheduleInput && (
              <div className="absolute bottom-full mb-2 left-0 bg-surface border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2 z-50 min-w-[200px]">
                <span className="text-[12px] font-medium text-secondary">Schedule Send</span>
                <input 
                  type="datetime-local" 
                  className="bg-bg border border-white/10 rounded-lg p-2 text-[13px] text-main outline-none focus:border-primary"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <div className="flex gap-2">
                  <button 
                    className="flex-1 text-[12px] bg-primary text-white py-1.5 rounded-lg"
                    onClick={() => setShowScheduleInput(false)}
                  >
                    Confirm
                  </button>
                  {scheduledAt && (
                    <button 
                      className="flex-1 text-[12px] bg-white/10 text-white py-1.5 rounded-lg hover:bg-danger/20 hover:text-danger"
                      onClick={() => { setScheduledAt(''); setShowScheduleInput(false); }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
          <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-secondary hover:text-main transition-colors" onClick={() => fileInputRef.current?.click()}>
            <Paperclip size={18} />
          </button>
        </div>
        <div className="flex items-center">
          <button onClick={closeComposer} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-danger/10 text-secondary hover:text-danger transition-colors"><Trash2 size={18} /></button>
        </div>
      </div>
    </div>
  );
}
