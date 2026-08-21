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
    <div className={`mail-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Mailbox Selector */}
      <div className="sidebar-selector-container">
        <button 
          className="sidebar-selector-btn"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="sidebar-selector-info">
            <div className="sidebar-selector-name">{activeMailbox?.displayName || 'Select Mailbox'}</div>
            <div className="sidebar-selector-address">{activeMailbox?.address || '...'}</div>
          </div>
          <ChevronDown size={16} color="var(--text-muted)" />
        </button>
        
        {isDropdownOpen && (
          <div className="sidebar-dropdown">
            {mailboxes.map(mb => (
              <button 
                key={mb._id} 
                className="sidebar-dropdown-item"
                onClick={() => {
                  setActiveMailbox(mb);
                  setIsDropdownOpen(false);
                }}
              >
                <div className="sidebar-dropdown-info">
                  <div className="sidebar-dropdown-name">{mb.displayName}</div>
                  <div className="sidebar-dropdown-address">{mb.address}</div>
                </div>
                {activeMailbox?._id === mb._id && <Check size={16} color="var(--primary)" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compose Button */}
      <div className="sidebar-compose-container">
        <button className="btn btn-primary sidebar-compose-btn" onClick={() => openComposer()}>
          <PenBox size={18} />
          Compose
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink 
            key={item.id} 
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
          >
            <div className="sidebar-nav-inner">
              <item.icon size={18} />
              <span>{item.label}</span>
            </div>
            {item.count > 0 && (
              <span className="sidebar-badge">{item.count}</span>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="sidebar-spacer"></div>

      {/* Settings */}
      <nav className="sidebar-nav">
        <NavLink 
          to="/settings"
          onClick={onClose}
          className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}
        >
          <div className="sidebar-nav-inner">
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </NavLink>
      </nav>
    </div>
  );
}
