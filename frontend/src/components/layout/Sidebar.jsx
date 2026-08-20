import { NavLink } from 'react-router-dom';
import { useMail } from '../../context/MailContext';
import { 
  Inbox, Send, File, Archive, AlertOctagon, Trash2, 
  Settings, PenBox, ChevronDown, Check
} from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
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
    <div style={styles.sidebar}>
      {/* Mailbox Selector */}
      <div style={styles.selectorContainer}>
        <button 
          style={styles.selectorBtn} 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div style={styles.selectorInfo}>
            <div style={styles.selectorName}>{activeMailbox?.displayName || 'Select Mailbox'}</div>
            <div style={styles.selectorAddress}>{activeMailbox?.address || '...'}</div>
          </div>
          <ChevronDown size={16} color="var(--text-muted)" />
        </button>
        
        {isDropdownOpen && (
          <div style={styles.dropdown}>
            {mailboxes.map(mb => (
              <button 
                key={mb._id} 
                style={styles.dropdownItem}
                onClick={() => {
                  setActiveMailbox(mb);
                  setIsDropdownOpen(false);
                }}
              >
                <div style={styles.dropdownItemInfo}>
                  <div style={styles.dropdownItemName}>{mb.displayName}</div>
                  <div style={styles.dropdownItemAddress}>{mb.address}</div>
                </div>
                {activeMailbox?._id === mb._id && <Check size={16} color="var(--primary)" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compose Button */}
      <div style={styles.composeContainer}>
        <button className="btn btn-primary" style={styles.composeBtn} onClick={() => openComposer()}>
          <PenBox size={18} />
          Compose
        </button>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems.map(item => (
          <NavLink 
            key={item.id} 
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {})
            })}
          >
            <div style={styles.navLinkInner}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </div>
            {item.count > 0 && (
              <span style={styles.badge}>{item.count}</span>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div style={{ flex: 1 }}></div>

      {/* Settings */}
      <nav style={styles.nav}>
        <NavLink 
          to="/settings"
          style={({ isActive }) => ({
            ...styles.navLink,
            ...(isActive ? styles.navLinkActive : {})
          })}
        >
          <div style={styles.navLinkInner}>
            <Settings size={18} />
            <span>Settings</span>
          </div>
        </NavLink>
      </nav>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px 0',
  },
  selectorContainer: {
    padding: '0 16px',
    marginBottom: '16px',
    position: 'relative',
  },
  selectorBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    textAlign: 'left',
  },
  selectorInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  selectorName: {
    fontWeight: '600',
    fontSize: '14px',
  },
  selectorAddress: {
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '16px',
    right: '16px',
    marginTop: '4px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '4px',
    zIndex: 10,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  },
  dropdownItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '6px',
    textAlign: 'left',
  },
  dropdownItemInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownItemName: {
    fontSize: '13px',
    fontWeight: '500',
  },
  dropdownItemAddress: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  composeContainer: {
    padding: '0 16px',
    marginBottom: '24px',
  },
  composeBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '15px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '0 12px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '8px',
    color: 'var(--text-muted)',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    color: 'var(--primary)',
    fontWeight: '500',
  },
  navLinkInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '14px',
  },
  badge: {
    backgroundColor: 'var(--primary)',
    color: 'white',
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: '600',
  }
};
