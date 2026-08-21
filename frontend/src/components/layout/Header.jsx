import { Search, Bell, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMail } from '../../context/MailContext';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { activeOrg } = useMail();

  return (
    <header className="mail-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onMenuClick}>
          <Menu size={20} color="var(--text-main)" />
        </button>
        <div className="header-brand">
          <span className="brand-name">Graxion Mail</span>
          {activeOrg && <span className="org-badge">{activeOrg.name}</span>}
        </div>
      </div>
      
      <div className="header-center header-search-container">
        <div className="search-bar">
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Search in mail..." 
            className="search-input"
          />
        </div>
      </div>
      
      <div className="header-right">
        <button className="icon-btn">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>
        
        <div className="user-menu">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="user-avatar-img" />
          ) : (
            <div className="avatar-fallback"><User size={18} /></div>
          )}
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
