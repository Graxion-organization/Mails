import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMail } from '../context/MailContext';
import api from '../utils/api';
import { formatDistanceToNow } from 'date-fns';
import { Star, Archive, Trash2, User, Search, PenSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Inbox({ folder = 'inbox', mode = 'normal' }) {
  const { activeOrg, activeMailbox, openComposer, labels } = useMail();
  const navigate = useNavigate();
  const { labelId } = useParams();
  
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, unread, needs_reply, starred, assigned
  const [selectedThreads, setSelectedThreads] = useState(new Set());
  
  // Pull to refresh state
  const [startY, setStartY] = useState(0);
  const [pullDist, setPullDist] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeOrg && activeMailbox) {
      fetchThreads();
    }
  }, [activeOrg, activeMailbox, folder, labelId, activeTab]);

  useEffect(() => {
    const handleRefresh = () => fetchThreads();
    window.addEventListener('mail:refresh', handleRefresh);
    return () => window.removeEventListener('mail:refresh', handleRefresh);
  }, [activeOrg, activeMailbox, folder, labelId, activeTab]);

  const fetchThreads = async (query = '') => {
    setLoading(true);
    try {
      if (folder === 'drafts') {
        const res = await api.get('/mail/drafts', {
          params: { orgId: activeOrg._id }
        });
        const formattedDrafts = (res.data?.data || []).map(draft => ({
          _id: draft._id,
          subject: draft.subject || '(No Subject)',
          snippet: draft.bodyText?.substring(0, 100) || '',
          participants: draft.to || [],
          updatedAt: draft.updatedAt,
          readBy: [{ account: activeMailbox._id }], // Mock as read
          isDraft: true,
          originalDraft: draft
        }));
        setThreads(formattedDrafts);
      } else {
        const res = await api.get('/mail/threads', {
          params: {
            orgId: activeOrg._id,
            mailboxId: activeMailbox._id,
            folder: mode === 'search' || mode === 'label' ? undefined : folder,
            search: query || undefined,
            labelId: mode === 'label' ? labelId : undefined,
            filter: activeTab !== 'all' ? activeTab : undefined
          }
        });
        setThreads(res.data?.data || []);
      }
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
      <div className="flex-1 flex items-center justify-center h-full text-secondary">
        <div className="animate-pulse">Loading messages...</div>
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

  const handleBatchAction = async (action) => {
    if (selectedThreads.size === 0) return;
    try {
      if (folder === 'drafts' && action === 'trash') {
        // Drafts use a different delete API
        for (const threadId of selectedThreads) {
          await api.delete(`/mail/drafts/${threadId}`);
        }
      } else {
        await api.post('/mail/threads/batch', {
          threadIds: Array.from(selectedThreads),
          action
        });
      }
      toast.success(`Items ${action === 'archive' ? 'archived' : 'deleted'}`);
      setSelectedThreads(new Set());
      fetchThreads();
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} items`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg relative overflow-hidden">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2 border-b border-white/5 bg-surface sticky top-0 z-10 shrink-0 min-h-[56px]">
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 text-secondary hover:text-main transition-colors group"
            onClick={() => {
              if (selectedThreads.size === threads.length && threads.length > 0) {
                setSelectedThreads(new Set());
              } else {
                setSelectedThreads(new Set(threads.map(t => t._id)));
              }
            }}
          >
            <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${selectedThreads.size > 0 ? 'bg-primary border-primary' : 'border-secondary group-hover:border-main'}`}>
              {selectedThreads.size > 0 && <span className="w-2 h-2 bg-white rounded-sm"></span>}
            </div>
          </button>
          
          {selectedThreads.size > 0 ? (
            <>
              {folder !== 'drafts' && (
                <button 
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 text-secondary hover:text-main transition-colors"
                  onClick={() => handleBatchAction('archive')}
                  title="Archive selected"
                >
                  <Archive size={18} />
                </button>
              )}
              <button 
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-danger/10 text-secondary hover:text-danger transition-colors"
                onClick={() => handleBatchAction('trash')}
                title="Delete selected"
              >
                <Trash2 size={18} />
              </button>
            </>
          ) : (
            <>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg text-secondary/30 cursor-not-allowed">
                <Archive size={18} />
              </button>
              <button className="w-10 h-10 flex items-center justify-center rounded-lg text-secondary/30 cursor-not-allowed">
                <Trash2 size={18} />
              </button>
            </>
          )}
          
          {mode === 'search' && (
            <form onSubmit={handleSearch} className="flex items-center ml-2 bg-bg border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-primary transition-colors">
              <input 
                type="text" 
                placeholder="Search emails..." 
                className="bg-transparent border-none outline-none text-main text-[14px] w-full max-w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          )}
        </div>
        <div className="text-[13px] text-secondary font-medium hidden sm:block">
          1-{threads.length > 0 ? threads.length : 0} of {threads.length > 0 ? threads.length : 0}
        </div>
      </div>

      {mode === 'normal' && folder === 'inbox' && (
        <div className="flex items-center gap-2 px-4 sm:px-6 py-2 border-b border-white/5 bg-bg sticky top-[56px] z-10 shrink-0 overflow-x-auto no-scrollbar shadow-sm">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'needs_reply', label: 'Needs Reply' },
            { id: 'starred', label: 'Starred' },
            { id: 'assigned', label: 'Assigned to Me' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-secondary hover:text-main hover:bg-white/5 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div 
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 space-y-1"
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
          <div className="flex flex-col items-center justify-center h-[60vh] text-center max-w-md mx-auto">
            <div className="text-6xl mb-6 opacity-80">📬</div>
            <h3 className="text-xl font-semibold text-main mb-2">No messages found</h3>
            <p className="text-secondary text-[14px] mb-8">Your {mode === 'search' ? 'search results' : folder} is empty.</p>
            <button className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-medium transition-transform hover:scale-105" onClick={() => openComposer()}>
              <PenSquare size={18} /> Compose New Email
            </button>
          </div>
        ) : (
          threads.map(thread => {
            const isUnread = !thread.readBy?.some(r => r.account === activeMailbox._id);
            
            return (
              <div 
                key={thread._id} 
                className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3.5 sm:py-4 rounded-[16px] cursor-pointer transition-all border border-transparent hover:border-white/5 ${isUnread ? 'bg-white/[0.03] shadow-sm' : 'hover:bg-white/[0.02]'}`}
                onClick={() => {
                  if (folder === 'drafts') {
                    openComposer({
                      type: 'draft',
                      draftId: thread._id,
                      to: thread.participants?.map(p => p.email).join(', ') || '',
                      subject: thread.subject || '',
                      body: thread.originalDraft?.bodyHtml || ''
                    });
                  } else {
                    navigate(`/thread/${thread._id}`);
                  }
                }}
              >
                <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  <button 
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors hidden sm:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = new Set(selectedThreads);
                      if (next.has(thread._id)) next.delete(thread._id);
                      else next.add(thread._id);
                      setSelectedThreads(next);
                    }}
                  >
                    <div className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-colors ${selectedThreads.has(thread._id) ? 'bg-primary border-primary' : 'border-secondary hover:border-main'}`}>
                      {selectedThreads.has(thread._id) && <span className="w-2 h-2 bg-white rounded-sm"></span>}
                    </div>
                  </button>
                  <button 
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors" 
                    onClick={(e) => toggleStar(e, thread._id, thread.isStarred)}
                  >
                    <Star 
                      size={18} 
                      fill={thread.isStarred ? '#f59e0b' : 'none'} 
                      color={thread.isStarred ? '#f59e0b' : '#6b7280'} 
                    />
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center min-w-0 flex-1 gap-1 sm:gap-4">
                  <div className={`flex items-center gap-2 shrink-0 w-full sm:w-[180px] md:w-[220px] text-[14px] ${isUnread ? 'font-semibold text-main' : 'font-medium text-main/90'}`}>
                    {/* Status Badges for Outbound */}
                    {thread.direction === 'outbound' && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${thread.status === 'delivered' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                        {thread.status}
                      </span>
                    )}
                    {/* Assigned indicator */}
                    {thread.assignedTo && (
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <User size={12} />
                      </div>
                    )}
                    <span className="truncate">
                      {mode === 'search' 
                        ? (thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Unknown')
                        : folder === 'sent' 
                          ? `To: ${thread.participants?.[0]?.name || thread.participants?.[0]?.email || 'Unknown'}`
                          : (thread.participants?.[0]?.name || thread.participants?.[0]?.email?.split('@')[0] || 'Unknown')
                      }
                    </span>
                    {thread.messageCount > 1 && <span className="bg-white/10 text-main text-[11px] font-bold px-1.5 py-0.5 rounded-md ml-auto sm:ml-0">{thread.messageCount}</span>}
                  </div>
                  
                  <div className="flex items-center min-w-0 flex-1 w-full gap-2">
                    <span className={`truncate block flex-1 min-w-0 text-[14px] ${isUnread ? 'font-semibold text-main' : 'text-main/90'}`}>
                      {thread.subject || '(No Subject)'}
                    </span>
                    
                    {/* Render Labels */}
                    {thread.labels?.map(labelObjOrId => {
                      const labelId = typeof labelObjOrId === 'string' ? labelObjOrId : labelObjOrId._id;
                      const label = labels?.find(l => l._id === labelId);
                      if (!label) return null;
                      return (
                        <span 
                          key={label._id}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium shrink-0 whitespace-nowrap hidden sm:inline-block"
                          style={{ backgroundColor: `${label.color}20`, color: label.color }}
                        >
                          {label.name}
                        </span>
                      );
                    })}
                    <span className="truncate text-[14px] text-secondary hidden sm:inline">
                      <span className="mx-1 opacity-50">-</span>
                      {thread.snippet || 'No content...'}
                    </span>
                  </div>
                </div>
                
                <div className={`shrink-0 text-[12px] whitespace-nowrap pl-2 ${isUnread ? 'font-semibold text-primary' : 'text-secondary font-medium'}`}>
                  {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <button 
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-transform z-20" 
        onClick={() => openComposer()} 
      >
        <PenSquare size={24} />
      </button>
    </div>
  );
}
