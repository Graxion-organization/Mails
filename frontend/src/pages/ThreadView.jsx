import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Reply, Forward, MoreVertical, Archive, Trash2, Eye, User, FileText, CheckCircle2, Tag, Paperclip, Smile, Type, ChevronDown, X } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { useMail } from '../context/MailContext';
import toast from 'react-hot-toast';
import EmojiPicker, { Theme } from 'emoji-picker-react';

export default function ThreadView() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { joinThread, leaveThread, threadPresence, socket } = useSocket();
  const { activeOrg, activeMailbox, openComposer } = useMail();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeNoteMessageId, setActiveNoteMessageId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [moreOptionsId, setMoreOptionsId] = useState(null);
  const [members, setMembers] = useState([]);

  // Inline Composer State
  const [replyText, setReplyText] = useState('');
  const [isComposerExpanded, setIsComposerExpanded] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchThread();
    joinThread(threadId);

    if (socket) {
      socket.on('note:added', handleNoteAdded);
      socket.on('note:deleted', handleNoteDeleted);
    }
    if (activeOrg) {
      fetchMembers();
    }

    return () => {
      leaveThread(threadId);
      if (socket) {
        socket.off('note:added', handleNoteAdded);
        socket.off('note:deleted', handleNoteDeleted);
      }
    };
  }, [threadId, socket, activeOrg]);

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/orgs/${activeOrg._id}/members`);
      if (res.data?.success) {
        setMembers(res.data.data.filter(m => m.status === 'active'));
      }
    } catch (error) {
      console.error('Failed to fetch org members', error);
    }
  };

  const handleNoteAdded = ({ messageId, note }) => {
    setData(prev => {
      if (!prev) return prev;
      const messages = prev.messages.map(m => {
        if (m._id === messageId) {
          return { ...m, internalNotes: [...m.internalNotes, note] };
        }
        return m;
      });
      return { ...prev, messages };
    });
  };

  const handleNoteDeleted = ({ messageId, noteId }) => {
    setData(prev => {
      if (!prev) return prev;
      const messages = prev.messages.map(m => {
        if (m._id === messageId) {
          return { ...m, internalNotes: m.internalNotes.filter(n => n._id !== noteId) };
        }
        return m;
      });
      return { ...prev, messages };
    });
  };

  const fetchThread = async () => {
    try {
      const res = await api.get(`/mail/threads/${threadId}`);
      setData(res.data?.data);
    } catch (error) {
      console.error('Failed to fetch thread', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    try {
      await api.put(`/mail/threads/${threadId}`, { status });
      setData(prev => ({ ...prev, thread: { ...prev.thread, status } }));
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error(error);
    }
  };

  const assignThread = async (userId) => {
    try {
      await api.put(`/mail/threads/${threadId}`, { assignedTo: userId });
      setData(prev => ({ ...prev, thread: { ...prev.thread, assignedTo: userId } }));
      setAssignDropdownOpen(false);
      toast.success(`Thread assigned`);
    } catch (error) {
      console.error(error);
    }
  };

  const submitNote = async (messageId) => {
    if (!noteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await api.post(`/mail/messages/${messageId}/notes`, { text: noteText });
      handleNoteAdded({ messageId, note: res.data?.data });
      setNoteText('');
      setActiveNoteMessageId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiObject) => {
    setReplyText(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    setTimeout(() => {
       if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = Math.min(Math.max(textareaRef.current.scrollHeight, 120), 240) + 'px';
       }
    }, 10);
  };

  const handleTextareaInput = (e) => {
    setReplyText(e.target.value);
    if (isComposerExpanded) {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(Math.max(e.target.scrollHeight, 120), 240) + 'px';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-secondary">Loading conversation...</div>;
  }

  if (!data) return null;

  const { thread, messages } = data;
  const presence = threadPresence[threadId] || [];

  return (
    <div className="flex flex-col h-full bg-bg text-main overflow-hidden">
      
      {/* Sticky Action Toolbar (56px) */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 h-[56px] shrink-0 border-b border-border bg-surface">
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <button className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-main hover:bg-white/5 transition-colors" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          
          <div className="w-px h-6 bg-border mx-1"></div>
          
          <div className="flex items-center bg-white/5 border border-border rounded-lg px-3 h-[32px] gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <select 
              className="bg-transparent text-main border-none text-[13px] outline-none cursor-pointer appearance-none pr-4 bg-no-repeat bg-right" 
              style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")"}}
              value={thread.status} 
              onChange={e => updateStatus(e.target.value)}
            >
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="relative">
            <button className="flex items-center bg-transparent text-main border border-border rounded-lg px-3 h-[32px] text-[13px] hover:bg-white/5 transition-colors" onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}>
              <User size={14} className="mr-1.5" /> 
              {thread.assignedTo ? 'Assigned' : 'Assign'}
            </button>
            {assignDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 bg-surface border border-border rounded-lg p-1 min-w-[150px] z-50 shadow-xl">
                <div className="px-3 py-2 text-[13px] text-main hover:bg-white/10 rounded cursor-pointer" onClick={() => assignThread(null)}>
                  Unassigned
                </div>
                {members.map(m => (
                  <div key={m.user?._id || m._id} className="px-3 py-2 text-[13px] text-main hover:bg-white/10 rounded cursor-pointer" onClick={() => assignThread(m.user?._id || m.invitedEmail)}>
                    {m.user?.name || m.invitedEmail}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-border mx-1"></div>
          
          <button className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-main hover:bg-white/5 transition-colors" title="Archive"><Archive size={16} /></button>
          <button className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-main hover:bg-white/5 transition-colors" title="Delete"><Trash2 size={16} /></button>
          <button className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-main hover:bg-white/5 transition-colors" title="Tags"><Tag size={16} /></button>
          <button className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-main hover:bg-white/5 transition-colors" title="More"><MoreVertical size={16} /></button>
        </div>
        
        <div className="flex items-center">
          {presence.length > 0 && (
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1" title="Colleagues viewing this thread">
              <Eye size={16} className="text-primary" />
              {presence.map((uid, idx) => (
                <div key={idx} className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[11px] font-bold">
                  {uid.substring(0, 1).toUpperCase()}
                </div>
              ))}
              <span className="text-[12px] text-primary ml-1">viewing now</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Thread Content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-12 pt-8 flex flex-col scroll-smooth">
        
        {/* Subject Header */}
        <div className="flex flex-col items-start gap-3 mb-8">
          <h2 className="text-[22px] font-semibold text-main m-0">{thread.subject}</h2>
          <div className="bg-white/5 text-secondary text-[12px] font-medium px-3 py-1 rounded-xl">
            {messages.length} email{messages.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2 flex-wrap">
              {thread.labels?.map(l => (
                <span key={l._id} className="px-2 py-0.5 rounded text-[12px] font-medium text-white" style={{backgroundColor: l.color}}>{l.name}</span>
              ))}
          </div>
        </div>

        {/* Message List */}
        <div className="flex flex-col gap-6 flex-1 pb-4">
          {messages.map((msg, index) => (
            <div key={msg._id} className="flex flex-col gap-6">
              {/* Divider Pill */}
              {index > 0 && (
                <div className="flex items-center justify-center relative my-2">
                  <div className="absolute inset-0 top-1/2 h-px bg-white/10 z-0"></div>
                  <span className="relative z-10 bg-[#1f2937] text-secondary text-[12px] px-3 py-1 rounded-full border border-border">
                    {index} previous message{index !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {/* Message Card */}
              <div className="bg-card border border-border rounded-[18px] overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between p-6 border-b border-white/5 gap-4">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-[20px] font-semibold shrink-0">
                      {msg.from.name ? msg.from.name[0].toUpperCase() : msg.from.email[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="text-[15px] font-semibold text-main flex items-center">
                        {msg.from.name || msg.from.email}
                      </div>
                      <div className="text-[13px] text-secondary">&lt;{msg.from.email}&gt;</div>
                      <div className="text-[13px] text-secondary flex items-center gap-1">
                        to <span className="text-[#60a5fa]">{msg.to.map(t => t.email).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <span className="text-[13px] text-secondary">{format(new Date(msg.createdAt), 'MMM d, yyyy, h:mm a')}</span>
                    <button 
                      className="flex items-center justify-center w-8 h-8 rounded-md text-secondary hover:text-main hover:bg-white/10 transition-colors"
                      onClick={() => {
                        textareaRef.current?.focus();
                        setReplyText(`\n\n\n--- On ${format(new Date(msg.createdAt), 'PPpp')}, ${msg.from.name || msg.from.email} wrote ---\n${msg.bodyText || ''}`);
                      }}
                      title="Reply"
                    >
                      <Reply size={16} />
                    </button>
                    <div className="relative">
                      <button 
                        className="flex items-center justify-center w-8 h-8 rounded-md text-secondary hover:text-main hover:bg-white/10 transition-colors" 
                        onClick={() => setMoreOptionsId(moreOptionsId === msg._id ? null : msg._id)}
                      >
                        <MoreVertical size={16} />
                      </button>
                      {moreOptionsId === msg._id && (
                        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg p-1 min-w-[150px] z-50 shadow-xl">
                          <div className="px-3 py-2 text-[13px] text-main hover:bg-white/10 rounded cursor-pointer">Copy Link</div>
                          <div className="px-3 py-2 text-[13px] text-main hover:bg-white/10 rounded cursor-pointer">Mark Unread</div>
                          <div className="px-3 py-2 text-[13px] text-main hover:bg-white/10 rounded cursor-pointer">Print</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* HTML content block */}
                <div className="p-6 text-[14px] leading-relaxed text-[#e5e7eb] break-words whitespace-normal overflow-hidden max-w-full">
                  <div 
                    className="message-html-content"
                    dangerouslySetInnerHTML={{ __html: msg.bodyHtml || `<div style="white-space: pre-wrap; font-family: inherit;">${msg.bodyText || ''}</div>` }}
                  />
                </div>
              </div>
              
              {/* Internal Notes Render */}
              {msg.internalNotes && msg.internalNotes.length > 0 && (
                <div className="flex flex-col gap-2 pl-8">
                  {msg.internalNotes.map(note => (
                    <div key={note._id} className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 border-l-4 border-l-[#f59e0b] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-[#f59e0b] text-black flex items-center justify-center text-[11px] font-bold">
                          {note.authorName[0]}
                        </div>
                        <span className="text-[13px] font-semibold text-[#fcd34d]">{note.authorName}</span>
                        <span className="text-[12px] text-[#fcd34d]/70">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <div className="text-[13px] text-main leading-relaxed whitespace-pre-wrap">{note.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Note Composer */}
              {activeNoteMessageId === msg._id && (
                <div className="ml-8 bg-surface border border-dashed border-[#f59e0b] rounded-lg p-4 flex flex-col gap-3">
                  <textarea
                    className="w-full min-h-[80px] bg-black/20 border border-border rounded-md p-3 text-main text-[14px] resize-y outline-none"
                    placeholder="Type an internal note... (only visible to your team)"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-3">
                    <button className="px-4 py-1.5 text-main bg-transparent hover:bg-white/10 rounded-md transition-colors" onClick={() => setActiveNoteMessageId(null)}>Cancel</button>
                    <button 
                      className="px-4 py-1.5 bg-[#f59e0b] text-black border-none rounded-md font-medium cursor-pointer" 
                      onClick={() => submitNote(msg._id)}
                      disabled={isSubmittingNote}
                    >
                      Add Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Reply Composer (Bottom) */}
      <div className="sticky bottom-0 z-20 w-full pb-4 px-2 sm:px-4 md:px-6 lg:px-8 shrink-0 transition-all duration-200">
        <div 
          className="bg-card border border-white/10 rounded-xl flex flex-col overflow-hidden shadow-2xl focus-within:border-white/20 transition-all duration-200 mx-auto w-full max-w-5xl"
          onClick={() => {
            if (!isComposerExpanded) {
              setIsComposerExpanded(true);
              setTimeout(() => {
                if (textareaRef.current) {
                   textareaRef.current.style.height = '120px';
                   textareaRef.current.focus();
                }
              }, 10);
            }
          }}
        >
          
          <div className={`flex gap-3 px-4 ${isComposerExpanded ? 'pt-4 pb-2' : 'py-2.5 items-center'}`}>
            <div className={`${isComposerExpanded ? 'w-8 h-8' : 'w-7 h-7'} rounded-full bg-primary text-white flex items-center justify-center text-[13px] font-semibold shrink-0 transition-all`}>
              Y
            </div>
            <textarea 
              ref={textareaRef}
              className={`w-full bg-transparent border-none text-main text-[14px] outline-none resize-none transition-all duration-200 ${isComposerExpanded ? 'min-h-[160px] max-h-[300px] pt-1.5' : 'h-[24px] pt-0.5 overflow-hidden'}`}
              placeholder="Reply..."
              value={replyText}
              onChange={handleTextareaInput}
              onFocus={() => {
                if (!isComposerExpanded) {
                  setIsComposerExpanded(true);
                  setTimeout(() => {
                    if (textareaRef.current) textareaRef.current.style.height = '160px';
                  }, 10);
                }
              }}
            />
          </div>

          {/* Attachments rendering */}
          {attachments.length > 0 && isComposerExpanded && (
            <div className="flex flex-wrap gap-2 px-4 pb-3">
              {attachments.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-surface border border-white/10 rounded-md px-3 py-1.5">
                  <FileText size={14} className="text-secondary" />
                  <span className="text-[12px] text-main max-w-[120px] truncate">{file.name}</span>
                  <button 
                    className="text-secondary hover:text-danger ml-1" 
                    onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            multiple 
          />
          
          {isComposerExpanded && (
            <div className="flex flex-wrap items-center justify-between p-3 bg-[#111827] border-t border-white/5 animate-in fade-in slide-in-from-top-2 duration-200 relative">
              
              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div className="absolute bottom-[110%] left-10 z-50 shadow-2xl border border-white/10 rounded-xl overflow-hidden">
                  <EmojiPicker 
                    theme={Theme.DARK}
                    onEmojiClick={onEmojiClick} 
                    searchDisabled
                    skinTonesDisabled
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <button 
                  className="flex items-center bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-md text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success("Reply sent!");
                    setReplyText("");
                    setAttachments([]);
                    setIsComposerExpanded(false);
                    setShowEmojiPicker(false);
                    textareaRef.current.style.height = '24px';
                  }}
                  disabled={!replyText.trim() && attachments.length === 0}
                >
                  <Reply size={14} className="mr-2"/> Send <ChevronDown size={14} className="ml-2"/>
                </button>
                
                <div className="w-px h-6 bg-border mx-2"></div>
                
                <button 
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-main hover:bg-white/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                   <Paperclip size={18}/>
                </button>
                <button 
                  className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-main hover:bg-white/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                >
                   <Smile size={18}/>
                </button>
                <button className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-main hover:bg-white/10 transition-colors">
                   <Type size={18}/>
                </button>
              </div>
              <button className="flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyText("");
                  setAttachments([]);
                  setIsComposerExpanded(false);
                  setShowEmojiPicker(false);
                  textareaRef.current.style.height = '24px';
                }}
              >
                <Trash2 size={18}/>
              </button>
            </div>
          )}
          
        </div>
      </div>
      
    </div>
  );
}
