import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMail } from '../context/MailContext';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { Star, MoreVertical, Archive, Trash2, User } from 'lucide-react';

export default function Inbox({ folder = 'inbox', mode = 'normal' }) {
  const { activeOrg, activeMailbox } = useMail();
  const navigate = useNavigate();
  
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrg && activeMailbox) {
      fetchThreads();
    }
  }, [activeOrg, activeMailbox, folder]);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await api.get('/mail/threads', {
        params: {
          orgId: activeOrg._id,
          mailboxId: activeMailbox._id,
          folder: mode === 'search' ? undefined : folder,
        }
      });
      setThreads(res.data || []);
    } catch (error) {
      console.error('Failed to fetch threads', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStar = async (e, threadId, isStarred) => {
    e.stopPropagation();
    try {
      // Optimistic UI update
      setThreads(threads.map(t => t._id === threadId ? { ...t, isStarred: !isStarred } : t));
      await api.put(`/mail/threads/${threadId}`, { isStarred: !isStarred });
    } catch (error) {
      fetchThreads(); // Revert on error
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}>Loading messages...</div>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>📬</div>
        <h3>No messages found</h3>
        <p>Your {folder} is empty.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolbarLeft}>
          <input type="checkbox" style={styles.checkbox} />
          <button style={styles.toolBtn}><Archive size={16} /></button>
          <button style={styles.toolBtn}><Trash2 size={16} /></button>
        </div>
        <div style={styles.toolbarRight}>
          <span style={styles.paginationText}>1-{threads.length} of {threads.length}</span>
        </div>
      </div>

      <div style={styles.threadList}>
        {threads.map(thread => (
          <div 
            key={thread._id} 
            style={{...styles.threadRow, ...(thread.isRead ? styles.threadRead : styles.threadUnread)}}
            onClick={() => navigate(`/thread/${thread._id}`)}
          >
            <div style={styles.rowActions} onClick={e => e.stopPropagation()}>
              <input type="checkbox" style={styles.checkbox} />
              <button 
                style={styles.starBtn} 
                onClick={(e) => toggleStar(e, thread._id, thread.isStarred)}
              >
                <Star 
                  size={18} 
                  fill={thread.isStarred ? '#f59e0b' : 'none'} 
                  color={thread.isStarred ? '#f59e0b' : 'var(--text-muted)'} 
                />
              </button>
            </div>
            
            <div style={styles.participants}>
              {thread.participants.filter(p => p.email !== activeMailbox?.address).map(p => p.name || p.email.split('@')[0]).join(', ') || 'Me'}
              {thread.messageCount > 1 && <span style={styles.countBadge}>{thread.messageCount}</span>}
            </div>
            
            <div style={styles.badgesWrapper}>
              {thread.status === 'pending' && <span style={styles.statusBadgePending}>Pending</span>}
              {thread.status === 'closed' && <span style={styles.statusBadgeClosed}>Closed</span>}
              {thread.assignedTo && <div style={styles.assignedBadge} title="Assigned"><User size={12}/></div>}
            </div>
            
            <div style={styles.subjectWrapper}>
              <span style={styles.subject}>{thread.subject}</span>
              <span style={styles.snippet}>- {thread.snippet}</span>
            </div>
            
            <div style={styles.date}>
              {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
            </div>
          </div>
        ))}
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
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    gap: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '8px',
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
    gap: '16px',
  },
  toolBtn: {
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px',
  },
  toolbarRight: {
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: 'var(--primary)',
    cursor: 'pointer',
  },
  threadList: {
    flex: 1,
    overflowY: 'auto',
  },
  threadRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 24px',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  threadRead: {
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-muted)',
  },
  threadUnread: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    color: 'var(--text-main)',
    fontWeight: '600',
  },
  rowActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginRight: '16px',
    minWidth: '60px',
  },
  starBtn: {
    display: 'flex',
    alignItems: 'center',
  },
  participants: {
    width: '200px',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  countBadge: {
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-muted)',
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  badgesWrapper: {
    display: 'flex',
    gap: '6px',
    marginRight: '12px',
    alignItems: 'center',
  },
  statusBadgePending: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    color: '#f59e0b',
    border: '1px solid rgba(245, 158, 11, 0.3)',
  },
  statusBadgeClosed: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    border: '1px solid rgba(34, 197, 94, 0.3)',
  },
  assignedBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: 'white',
  },
  subjectWrapper: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '14px',
  },
  subject: {
    marginRight: '8px',
  },
  snippet: {
    color: 'var(--text-muted)',
    fontWeight: '400',
  },
  date: {
    width: '100px',
    textAlign: 'right',
    fontSize: '13px',
    color: 'var(--text-muted)',
  }
};
