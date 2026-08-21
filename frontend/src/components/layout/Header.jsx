import { Search, Bell, User, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMail } from '../../context/MailContext';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { activeOrg } = useMail();

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-bg">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 -ml-2 rounded-lg text-main hover:bg-white/5" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[16px] font-bold tracking-tight text-main">Graxion Mail</span>
          {activeOrg && <span className="bg-primary/20 text-primary text-[11px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{activeOrg.name}</span>}
        </div>
      </div>
      
      <div className="flex-1 max-w-xl px-8 hidden md:block">
        <div className="relative flex items-center w-full bg-surface border border-white/10 rounded-lg focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
          <Search size={18} className="absolute left-3 text-secondary" />
          <input 
            type="text" 
            placeholder="Search in mail..." 
            className="w-full bg-transparent border-none text-[14px] text-main placeholder-secondary py-2 pl-10 pr-4 outline-none"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="relative w-10 h-10 flex items-center justify-center rounded-lg text-secondary hover:text-main hover:bg-white/5 transition-colors">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full ring-2 ring-bg"></span>
        </button>
        
        <div className="flex items-center gap-3 ml-2 pl-4 border-l border-white/5">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-surface border border-white/10 flex items-center justify-center text-secondary"><User size={16} /></div>
          )}
          <button className="text-[13px] font-medium text-secondary hover:text-danger transition-colors" onClick={logout}>Logout</button>
        </div>
      </div>
    </header>
  );
}
