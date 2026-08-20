import { Search, Bell, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMail } from '../../context/MailContext';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { activeOrg } = useMail();

  return (
    <header className="mail-header">
      <div style={styles.left}>
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={20} color="var(--text-main)" />
        </button>
        <div style={styles.brand}>
          {/* We can put a small logo here */}
          <span style={styles.brandName}>Graxion Mail</span>
          {activeOrg && <span style={styles.orgBadge}>{activeOrg.name}</span>}
        </div>
      </div>
      
      <div style={styles.center} className="header-search-container">
        <div style={styles.searchBar}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search in mail..." 
            style={styles.searchInput}
          />
        </div>
      </div>
      
      <div style={styles.right}>
        <button style={styles.iconBtn}>
          <Bell size={20} />
          {/* Unread dot */}
          <span style={styles.notificationDot}></span>
        </button>
        
        <div style={styles.userMenu}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={styles.avatar} />
          ) : (
            <div style={styles.avatarFallback}><User size={18} /></div>
          )}
          <button style={styles.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    borderBottom: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-main)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandName: {
    fontWeight: '700',
    fontSize: '18px',
    letterSpacing: '-0.02em',
  },
  orgBadge: {
    backgroundColor: 'var(--bg-surface)',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'var(--text-muted)',
    border: '1px solid var(--border-color)',
  },
  center: {
    flex: 2,
    display: 'flex',
    justifyContent: 'center',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '8px 16px',
    width: '100%',
    maxWidth: '500px',
    transition: 'border-color 0.2s',
  },
  searchInput: {
    background: 'none',
    border: 'none',
    color: 'var(--text-main)',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '20px',
    flex: 1,
  },
  iconBtn: {
    position: 'relative',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: '0px',
    right: '2px',
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--danger)',
    borderRadius: '50%',
    border: '2px solid var(--bg-main)',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--border-color)',
  },
  avatarFallback: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--bg-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
  },
  logoutBtn: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  }
};
