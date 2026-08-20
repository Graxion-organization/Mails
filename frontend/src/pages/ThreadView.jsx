import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Reply, Forward, MoreVertical, Archive, Trash2, Eye, User, FileText, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { useMail } from '../context/MailContext';
import toast from 'react-hot-toast';
import './ThreadView.css';

export default function ThreadView() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { joinThread, leaveThread, threadPresence, socket } = useSocket();
  const { activeOrg, activeMailbox, openComposer } = useMail();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Note composer state
  const [activeNoteMessageId, setActiveNoteMessageId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Dropdown states
  const [assignDropdownOpen, setAssignDropdownOpen] = useState(false);
  const [moreOptionsId, setMoreOptionsId] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchThread();
    joinThread(threadId);

    // Setup socket listeners for notes
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
      // Optimistic update
      handleNoteAdded({ messageId, note: res.data?.data });
      setNoteText('');
      setActiveNoteMessageId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (loading) {
    return <div className="thread-center-msg">Loading conversation...</div>;
  }

  if (!data) return null;

  const { thread, messages } = data;
  const presence = threadPresence[threadId] || [];

  return (
    <div className="thread-container">
      {/* Toolbar */}
      <div className="thread-toolbar">
        <div className="thread-toolbar-left">
          <button className="thread-icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          
          <div className="thread-divider"></div>
          
          <select 
            className="thread-status-select" 
            value={thread.status} 
            onChange={e => updateStatus(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
          
          <div className="thread-dropdown">
            <button className="thread-btn-outline" onClick={() => setAssignDropdownOpen(!assignDropdownOpen)}>
              <User size={14} style={{ marginRight: '6px' }}/> 
              {thread.assignedTo ? 'Assigned' : 'Assign'}
            </button>
            {assignDropdownOpen && (
              <div className="thread-dropdown-menu">
                <div className="thread-dropdown-item" onClick={() => assignThread(null)}>
                  Unassigned
                </div>
                {members.map(m => (
                  <div key={m.user?._id || m._id} className="thread-dropdown-item" onClick={() => assignThread(m.user?._id || m.invitedEmail)}>
                    {m.user?.name || m.invitedEmail}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="thread-divider"></div>
          
          <button className="thread-icon-btn" title="Archive"><Archive size={16} /></button>
          <button className="thread-icon-btn" title="Delete"><Trash2 size={16} /></button>
        </div>
        
        <div className="thread-toolbar-right">
          {presence.length > 0 && (
            <div className="thread-presence-container" title="Colleagues viewing this thread">
              <Eye size={16} color="var(--primary)" />
              {presence.map((uid, idx) => (
                <div key={idx} className="thread-presence-avatar">
                  {uid.substring(0, 1).toUpperCase()}
                </div>
              ))}
              <span className="thread-presence-text">viewing now</span>
            </div>
          )}
        </div>
      </div>

      {/* Content scroll area */}
      <div className="thread-content">
        <div className="thread-subject-header">
          <h2 className="thread-subject">{thread.subject}</h2>
          <div className="thread-labels">
            {thread.labels?.map(l => (
              <span key={l._id} className="thread-label-badge" style={{backgroundColor: l.color}}>{l.name}</span>
            ))}
          </div>
        </div>

        <div className="thread-messages-list">
          {messages.map((msg, index) => (
            <div key={msg._id} className="thread-message-group">
              {/* Actual Message Card */}
              <div className="thread-message-card">
                <div className="thread-message-header">
                  <div className="thread-sender-avatar">
                    {msg.from.name ? msg.from.name[0].toUpperCase() : msg.from.email[0].toUpperCase()}
                  </div>
                  <div className="thread-sender-info">
                    <div className="thread-sender-name">
                      {msg.from.name || msg.from.email}
                      <span className="thread-sender-email">&lt;{msg.from.email}&gt;</span>
                    </div>
                    <div className="thread-to-info">
                      to {msg.to.map(t => t.name || t.email).join(', ')}
                    </div>
                  </div>
                  <div className="thread-message-meta">
                    <div className="thread-date">{format(new Date(msg.createdAt), 'MMM d, yyyy, h:mm a')}</div>
                    <div className="thread-message-actions">
                      <button className="thread-icon-btn-small" onClick={() => setActiveNoteMessageId(activeNoteMessageId === msg._id ? null : msg._id)} title="Add Internal Note">
                        <FileText size={14} />
                      </button>
                      <button 
                        className="thread-icon-btn-small"
                        onClick={() => {
                          const replyToEmail = msg.from.email;
                          const subjectPrefix = msg.subject.startsWith('Re:') ? '' : 'Re: ';
                          openComposer({
                            type: 'reply',
                            messageId: msg._id,
                            to: replyToEmail,
                            subject: `${subjectPrefix}${msg.subject}`,
                            body: `\n\n\n--- On ${format(new Date(msg.createdAt), 'PPpp')}, ${msg.from.name || msg.from.email} wrote ---\n${msg.bodyText || ''}`
                          });
                        }}
                        title="Reply"
                      >
                        <Reply size={14} />
                      </button>
                      
                      {/* Forward Button added here */}
                      <button 
                        className="thread-icon-btn-small"
                        onClick={() => {
                          const subjectPrefix = msg.subject.startsWith('Fwd:') ? '' : 'Fwd: ';
                          openComposer({
                            type: 'forward',
                            messageId: msg._id,
                            to: '',
                            subject: `${subjectPrefix}${msg.subject}`,
                            body: `\n\n\n---------- Forwarded message ---------\nFrom: ${msg.from.name} <${msg.from.email}>\nDate: ${format(new Date(msg.createdAt), 'PPpp')}\nSubject: ${msg.subject}\nTo: ${msg.to.map(t => t.email).join(', ')}\n\n${msg.bodyText || ''}`
                          });
                        }}
                        title="Forward"
                      >
                        <Forward size={14} />
                      </button>

                      {/* More Options Dropdown */}
                      <div className="thread-dropdown">
                        <button 
                          className="thread-icon-btn-small" 
                          onClick={() => setMoreOptionsId(moreOptionsId === msg._id ? null : msg._id)}
                        >
                          <MoreVertical size={14} />
                        </button>
                        {moreOptionsId === msg._id && (
                          <div className="thread-dropdown-menu" style={{right: 0, left: 'auto'}}>
                            <div className="thread-dropdown-item">Copy Link</div>
                            <div className="thread-dropdown-item">Mark Unread</div>
                            <div className="thread-dropdown-item">Print</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="thread-message-body"
                  dangerouslySetInnerHTML={{ __html: msg.bodyHtml || `<p>${msg.bodyText}</p>` }}
                />
              </div>
              
              {/* Internal Notes Render */}
              {msg.internalNotes && msg.internalNotes.length > 0 && (
                <div className="thread-notes-container">
                  {msg.internalNotes.map(note => (
                    <div key={note._id} className="thread-note-card">
                      <div className="thread-note-header">
                        <div className="thread-note-author-avatar">
                          {note.authorName[0]}
                        </div>
                        <span className="thread-note-author">{note.authorName}</span>
                        <span className="thread-note-date">{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <div className="thread-note-body">{note.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Note Composer */}
              {activeNoteMessageId === msg._id && (
                <div className="thread-note-composer">
                  <textarea
                    className="thread-note-textarea"
                    placeholder="Type an internal note... (only visible to your team)"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    autoFocus
                  />
                  <div className="thread-note-composer-actions">
                    <button className="btn-ghost" onClick={() => setActiveNoteMessageId(null)}>Cancel</button>
                    <button 
                      className="thread-btn-add-note" 
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
    </div>
  );
}
