import { useState, useRef } from 'react';
import { useMail } from '../../context/MailContext';
import { X, Minus, Maximize2, Paperclip, Send, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function Composer() {
  const { closeComposer, activeOrg, activeMailbox, composerInitialData } = useMail();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const [to, setTo] = useState(composerInitialData?.to || '');
  const [subject, setSubject] = useState(composerInitialData?.subject || '');
  const [body, setBody] = useState(composerInitialData?.body || '');
  const [attachments, setAttachments] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!to) return toast.error('Please specify a recipient');
    
    setIsSending(true);
    try {
      const recipients = to.split(',').map(email => email.trim()).filter(Boolean);
      const cleanBodyText = body.replace(/<[^>]+>/g, ''); // strip HTML for plain text fallback
      
      const formData = new FormData();
      formData.append('organizationId', activeOrg?._id);
      formData.append('mailboxId', activeMailbox?._id);
      
      recipients.forEach(email => formData.append('to[]', email));
      
      if (composerInitialData?.type === 'reply') {
        formData.append('messageId', composerInitialData.messageId);
        formData.append('replyAll', false);
      } else {
        formData.append('subject', subject);
      }
      
      formData.append('bodyText', cleanBodyText);
      formData.append('bodyHtml', body);
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      if (composerInitialData?.type === 'reply') {
        await api.post('/mail/reply', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/mail/send', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
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
    <div className={`fixed z-[100] bg-bg border border-white/10 flex flex-col shadow-2xl animate-slide-up ${isFullScreen ? 'inset-4 rounded-xl' : 'bottom-6 right-6 lg:right-10 w-[600px] h-[550px] rounded-xl'}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-white/5 rounded-t-xl shrink-0">
        <div className="text-[14px] font-medium text-main">New Message</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-secondary hover:text-main transition-colors"><Minus size={16} /></button>
          <button onClick={() => setIsFullScreen(!isFullScreen)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-secondary hover:text-main transition-colors"><Maximize2 size={16} /></button>
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
          <div className="flex items-center bg-primary rounded-lg">
            <button 
              className="px-5 py-2 text-[14px] font-medium text-white hover:bg-white/10 transition-colors rounded-l-lg border-r border-white/20 disabled:opacity-50" 
              onClick={handleSend}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
            <button className="px-3 py-2 text-white hover:bg-white/10 transition-colors rounded-r-lg">
              <Clock size={16} />
            </button>
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
