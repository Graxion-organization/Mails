import { NavLink } from 'react-router-dom';
import { useMail } from '../../context/MailContext';
import { 
  Inbox, Send, File, Archive, AlertOctagon, Trash2, 
  Settings, PenBox, ChevronDown, Check
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({ isOpen, onClose }) {
  const { mailboxes, activeMailbox, setActiveMailbox, openComposer, stats } = useMail();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, path: '/inbox', count: stats.unread },
    { id: 'sent', label: 'Sent', icon: Send, path: '/sent' },
    { id: 'drafts', label: 'Drafts', icon: File, path: '/drafts', count: stats.drafts },
    { id: 'archive', label: 'Archive', icon: Archive, path: '/archive' },
    { id: 'spam', label: 'Spam', icon: AlertOctagon, path: '/spam', count: stats.spam },
    { id: 'trash', label: 'Trash', icon: Trash2, path: '/trash' },
  ];

  return (
    <div className={`w-[260px] bg-sidebar border-r border-white/5 flex flex-col transition-transform duration-300 z-[100] shrink-0 ${isOpen ? 'translate-x-0 fixed inset-y-0 left-0' : '-translate-x-full fixed inset-y-0 left-0 lg:translate-x-0 lg:static'}`}>
      {/* Mailbox Selector */}
      <div className="p-4 border-b border-white/5 relative">
        <button 
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex flex-col overflow-hidden">
            <div className="text-[14px] font-semibold text-main truncate">{activeMailbox?.displayName || 'Select Mailbox'}</div>
            <div className="text-[12px] text-secondary truncate">{activeMailbox?.address || '...'}</div>
          </div>
          <ChevronDown size={16} className="text-secondary shrink-0 ml-2" />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute top-full left-4 right-4 mt-1 bg-surface border border-white/10 rounded-xl shadow-2xl py-1 z-50 max-h-[300px] overflow-y-auto">
            {mailboxes.map(mb => (
              <button 
                key={mb._id} 
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors text-left"
                onClick={() => {
                  setActiveMailbox(mb);
                  setIsDropdownOpen(false);
                }}
              >
                <div className="flex flex-col overflow-hidden">
                  <div className="text-[13px] font-medium text-main truncate">{mb.displayName}</div>
                  <div className="text-[12px] text-secondary truncate">{mb.address}</div>
                </div>
                {activeMailbox?._id === mb._id && <Check size={16} className="text-primary shrink-0 ml-2" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compose Button */}
      <div className="p-4">
        <button 
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-[14px] font-medium transition-colors"
          onClick={() => openComposer()}
        >
          <PenBox size={18} />
          Compose
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map(item => (
          <NavLink 
            key={item.id} 
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-[14px] font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-white/5 hover:text-main'}`}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? 'text-primary' : 'text-secondary'} />
                  <span>{item.label}</span>
                </div>
                {item.count > 0 && (
                  <span className="bg-primary/20 text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      {/* Settings */}
      <nav className="p-3 border-t border-white/5">
        <NavLink 
          to="/settings"
          onClick={onClose}
          className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[14px] font-medium ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-white/5 hover:text-main'}`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
