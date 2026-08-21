import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMail } from '../context/MailContext';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { Star, Archive, Trash2, User, Search, PenSquare } from 'lucide-react';
import './Inbox.css';

export default function Inbox({ folder = 'inbox', mode = 'normal' }) {
  const { activeOrg, activeMailbox, openComposer } = useMail();
  const navigate = useNavigate();
  
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pull to refresh state
  const [startY, setStartY] = useState(0);
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeOrg && activeMailbox) {
      fetchThreads();
    }
  }, [activeOrg, activeMailbox, folder]);

  const fetchThreads = async (query = '') => {
    setLoading(true);
    try {
      const res = await api.get('/mail/threads', {
        params: {
          orgId: activeOrg._id,
          mailboxId: activeMailbox._id,
          folder: mode === 'search' ? undefined : folder,
          search: query || undefined,
        }
      });
      setThreads(res.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch threads', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchThreads(searchQuery);
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
      <div className="inbox-loading-container">
        <div className="loader">Loading messages...</div>
      </div>
    );
  }

  const handleTouchStart = (e) => {
    if (e.currentTarget.scrollTop <= 0) {
      setStartY(e.touches[0].clientY);
    } else {
      setStartY(0);
    }
  };

  const handleTouchMove = (e) => {
    if (startY === 0) return;
    const y = e.touches[0].clientY;
    const dist = y - startY;
    if (dist > 0) {
      setPullDist(Math.min(dist * 0.4, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDist > 50) {
      setRefreshing(true);
      await fetchThreads();
      setRefreshing(false);
    }
    setPullDist(0);
    setStartY(0);
  };

  return (
    <div className="inbox-container">
      <div className="inbox-toolbar">
        <div className="inbox-toolbar-left">
          <input type="checkbox" className="inbox-checkbox" />
          <button className="inbox-tool-btn"><Archive size={16} /></button>
          <button className="inbox-tool-btn"><Trash2 size={16} /></button>
          
          {mode === 'search' && (
            <form onSubmit={handleSearch} style={{display: 'flex', alignItems: 'center'}}>
              <input 
                type="text" 
                placeholder="Search emails..." 
                className="inbox-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          )}
        </div>
        <div className="inbox-toolbar-right">
          <span className="pagination-text">1-{threads.length > 0 ? threads.length : 0} of {threads.length > 0 ? threads.length : 0}</span>
        </div>
      </div>

      <div 
        className="inbox-thread-list"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ 
          height: `${pullDist}px`, 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          overflow: 'hidden',
          transition: refreshing ? 'height 0.2s' : 'none',
          color: 'var(--text-muted)',
          fontSize: '13px'
        }}>
           {refreshing ? 'Refreshing...' : 'Pull down to refresh'}
        </div>
        {threads.length === 0 ? (
          <div className="inbox-empty-container">
            <div className="inbox-empty-icon">📬</div>
            <h3>No messages found</h3>
            <p>Your {mode === 'search' ? 'search results' : folder} is empty.</p>
            <button className="btn btn-primary" onClick={() => openComposer()}>
              <PenSquare size={16} style={{marginRight: 8}} /> Compose New Email
            </button>
          </div>
        ) : (
          threads.map(thread => {
            const isUnread = !thread.readBy?.some(r => r.account === activeMailbox._id);
            
            return (
              <div 
                key={thread._id} 
                className={`inbox-thread-row ${isUnread ? 'inbox-thread-unread' : 'inbox-thread-read'}`}
                onClick={() => navigate(`/thread/${thread._id}`)}
              >
                <div className="inbox-row-actions" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" className="inbox-checkbox" />
                  <button 
                    className="inbox-star-btn" 
                    onClick={(e) => toggleStar(e, thread._id, thread.isStarred)}
                  >
                    <Star 
                      size={18} 
                      fill={thread.isStarred ? '#f59e0b' : 'none'} 
                      color={thread.isStarred ? '#f59e0b' : 'var(--text-muted)'} 
                    />
                  </button>
                </div>
                
                <div className="inbox-participants">
                  {/* Status Badges for Outbound */}
                  {thread.direction === 'outbound' && (
                    <span className={thread.status === 'delivered' ? 'inbox-status-badge-closed' : 'inbox-status-badge-pending'}>
                      {thread.status}
                    </span>
                  )}
                  {/* Assigned indicator */}
                  {thread.assignedTo && (
                    <div className="inbox-assigned-badge">
                      <User size={12} />
                    </div>
                  )}
                  <span>
                    {mode === 'search' 
                      ? (thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Unknown')
                      : folder === 'sent' 
                        ? `To: ${thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Unknown'}`
                        : (thread.participants?.[0]?.name || thread.participants?.[0]?.email?.split('@')[0] || 'Unknown')
                    }
                  </span>
                  {thread.messageCount > 1 && <span className="inbox-count-badge">{thread.messageCount}</span>}
                </div>
                
                <div className="inbox-thread-subject-wrapper">
                  <div className="inbox-badges-wrapper">
                    {/* Any labels can go here */}
                  </div>
                  <span className="inbox-thread-subject-text" style={{fontWeight: isUnread ? '600' : '400'}}>
                    {thread.subject || '(No Subject)'}
                  </span>
                  <span className="inbox-snippet">- {thread.snippet || 'No content...'}</span>
                </div>
                
                <div className="inbox-thread-date">
                  {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button className="fab-compose" onClick={() => openComposer()} title="Compose Email">
        <PenSquare size={24} />
      </button>
    </div>
  );
}
