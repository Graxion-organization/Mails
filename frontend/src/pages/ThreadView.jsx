import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Reply, Forward, MoreVertical, Archive, Trash2, Eye, User, Send, FileText } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { useMail } from '../context/MailContext';
import toast from 'react-hot-toast';

export default function ThreadView() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { joinThread, leaveThread, threadPresence, socket } = useSocket();
  const { activeOrg, activeMailbox } = useMail();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Note composer state
  const [activeNoteMessageId, setActiveNoteMessageId] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  useEffect(() => {
    fetchThread();
    joinThread(threadId);

    // Setup socket listeners for notes
    if (socket) {
      socket.on('note:added', handleNoteAdded);
      socket.on('note:deleted', handleNoteDeleted);
    }

    return () => {
      leaveThread(threadId);
      if (socket) {
        socket.off('note:added', handleNoteAdded);
        socket.off('note:deleted', handleNoteDeleted);
      }
    };
  }, [threadId, socket]);

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
      setData(res.data);
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

  const submitNote = async (messageId) => {
    if (!noteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      const res = await api.post(`/mail/messages/${messageId}/notes`, { text: noteText });
      // Optimistic update
      handleNoteAdded({ messageId, note: res.data });
      setNoteText('');
      setActiveNoteMessageId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (loading) {
    return <div style={styles.centerMsg}>Loading conversation...</div>;
  }

  if (!data) return null;

  const { thread, messages } = data;
  const presence = threadPresence[threadId] || [];

  return (
    <div style={styles.container}>
      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <button style={styles.iconBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          
          <div style={styles.divider}></div>
          
          <select 
            style={styles.statusSelect} 
            value={thread.status} 
            onChange={e => updateStatus(e.target.value)}
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
          </select>
          
          <button style={styles.btnOutline}>
            <User size={14} style={{ marginRight: '6px' }}/> 
            {thread.assignedTo ? 'Assigned' : 'Assign'}
          </button>

          <div style={styles.divider}></div>
          
          <button style={styles.iconBtn}><Archive size={16} /></button>
          <button style={styles.iconBtn}><Trash2 size={16} /></button>
        </div>
        
        <div style={styles.toolbarRight}>
          {presence.length > 0 && (
            <div style={styles.presenceContainer} title="Colleagues viewing this thread">
              <Eye size={16} color="var(--primary)" />
              {presence.map((uid, idx) => (
                <div key={idx} style={styles.presenceAvatar}>
                  {uid.substring(0, 1).toUpperCase()}
                </div>
              ))}
              <span style={styles.presenceText}>viewing now</span>
            </div>
          )}
        </div>
      </div>

      {/* Content scroll area */}
      <div style={styles.content}>
        <div style={styles.subjectHeader}>
          <h2 style={styles.subject}>{thread.subject}</h2>
          <div style={styles.labels}>
            {thread.labels?.map(l => (
              <span key={l._id} style={{...styles.labelBadge, backgroundColor: l.color}}>{l.name}</span>
            ))}
          </div>
        </div>

        <div style={styles.messagesList}>
          {messages.map((msg, index) => (
            <div key={msg._id} style={styles.messageGroup}>
              {/* Actual Message Card */}
              <div style={styles.messageCard}>
                <div style={styles.messageHeader}>
                  <div style={styles.senderAvatar}>
                    {msg.from.name ? msg.from.name[0].toUpperCase() : msg.from.email[0].toUpperCase()}
                  </div>
                  <div style={styles.senderInfo}>
                    <div style={styles.senderName}>
                      {msg.from.name || msg.from.email}
                      <span style={styles.senderEmail}>&lt;{msg.from.email}&gt;</span>
                    </div>
                    <div style={styles.toInfo}>
                      to {msg.to.map(t => t.name || t.email).join(', ')}
                    </div>
                  </div>
                  <div style={styles.messageMeta}>
                    <div style={styles.date}>{format(new Date(msg.createdAt), 'MMM d, yyyy, h:mm a')}</div>
                    <div style={styles.messageActions}>
                      <button style={styles.iconBtnSmall} onClick={() => setActiveNoteMessageId(activeNoteMessageId === msg._id ? null : msg._id)} title="Add Internal Note"><FileText size={14} /></button>
                      <button style={styles.iconBtnSmall}><Reply size={14} /></button>
                      <button style={styles.iconBtnSmall}><MoreVertical size={14} /></button>
                    </div>
                  </div>
                </div>
                
                <div 
                  style={styles.messageBody}
                  dangerouslySetInnerHTML={{ __html: msg.bodyHtml || `<p>${msg.bodyText}</p>` }}
                />
              </div>
              
              {/* Internal Notes Render */}
              {msg.internalNotes && msg.internalNotes.length > 0 && (
                <div style={styles.notesContainer}>
                  {msg.internalNotes.map(note => (
                    <div key={note._id} style={styles.noteCard}>
                      <div style={styles.noteHeader}>
                        <div style={styles.noteAuthorAvatar}>
                          {note.authorName[0]}
                        </div>
                        <span style={styles.noteAuthor}>{note.authorName}</span>
                        <span style={styles.noteDate}>{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
                      </div>
                      <div style={styles.noteBody}>{note.text}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Note Composer */}
              {activeNoteMessageId === msg._id && (
                <div style={styles.noteComposer}>
                  <textarea
                    style={styles.noteTextarea}
                    placeholder="Type an internal note... (only visible to your team)"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    autoFocus
                  />
                  <div style={styles.noteComposerActions}>
                    <button style={styles.btnGhost} onClick={() => setActiveNoteMessageId(null)}>Cancel</button>
                    <button 
                      className="btn btn-primary" 
                      style={styles.btnAddNote} 
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

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  centerMsg: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 24px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-main)',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
  },
  iconBtn: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background-color 0.2s',
  },
  iconBtnSmall: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '6px',
    borderRadius: '4px',
  },
  divider: {
    width: '1px',
    height: '24px',
    backgroundColor: 'var(--border-color)',
    margin: '0 4px',
  },
  statusSelect: {
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-main)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
    outline: 'none',
  },
  btnOutline: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'transparent',
    color: 'var(--text-main)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '13px',
  },
  presenceContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '16px',
    padding: '4px 12px',
  },
  presenceAvatar: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  presenceText: {
    fontSize: '12px',
    color: 'var(--primary)',
    marginLeft: '4px',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 40px',
  },
  subjectHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
  },
  subject: {
    fontSize: '24px',
    fontWeight: '400',
    color: 'var(--text-main)',
  },
  labels: {
    display: 'flex',
    gap: '8px',
  },
  labelBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    paddingBottom: '40px',
  },
  messageGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  messageCard: {
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '16px 24px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  senderAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600',
    marginRight: '16px',
  },
  senderInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '2px',
  },
  senderEmail: {
    fontWeight: '400',
    color: 'var(--text-muted)',
    marginLeft: '8px',
    fontSize: '13px',
  },
  toInfo: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  messageMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px',
  },
  date: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  messageActions: {
    display: 'flex',
    gap: '4px',
  },
  messageBody: {
    padding: '24px',
    fontSize: '14px',
    lineHeight: '1.6',
    color: 'var(--text-main)',
    overflowX: 'auto',
  },
  notesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingLeft: '32px', // Indent notes to distinguish them
  },
  noteCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderLeft: '4px solid #f59e0b',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  noteHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  noteAuthorAvatar: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#f59e0b',
    color: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  noteAuthor: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#fcd34d',
  },
  noteDate: {
    fontSize: '12px',
    color: 'rgba(252, 211, 77, 0.7)',
  },
  noteBody: {
    fontSize: '13px',
    color: 'var(--text-main)',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  noteComposer: {
    marginLeft: '32px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px dashed #f59e0b',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  noteTextarea: {
    width: '100%',
    minHeight: '80px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    padding: '12px',
    color: 'var(--text-main)',
    fontSize: '14px',
    resize: 'vertical',
    outline: 'none',
  },
  noteComposerActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  btnGhost: {
    padding: '6px 12px',
    fontSize: '13px',
    color: 'var(--text-muted)',
    cursor: 'pointer',
  },
  btnAddNote: {
    padding: '6px 16px',
    backgroundColor: '#f59e0b',
    color: 'black',
  }
};
