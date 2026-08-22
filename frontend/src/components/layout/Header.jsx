import { Search, Bell, User, Menu, Mail, Sparkles, Workflow, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMail } from '../../context/MailContext';
import { useState, useRef, useEffect } from 'react';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { activeOrg } = useMail();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const authUrl = import.meta.env.VITE_AUTH_URL || 'https://accounts.graxion.in';
  const mailUrl = import.meta.env.VITE_MAIL_URL || 'https://mail.graxion.in';
  const aiUrl = import.meta.env.VITE_AI_URL || 'https://ai.graxion.in';
  const flowUrl = import.meta.env.VITE_FLOW_URL || 'https://flow.graxion.in';

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
        
        <div className="relative flex items-center gap-3 ml-2 pl-4 border-l border-white/5" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center justify-center outline-none ring-2 ring-transparent focus:ring-primary/50 rounded-full transition-all"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.fullName || 'User'} className="w-9 h-9 rounded-full object-cover border border-white/10 hover:border-white/30 transition-colors" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-surface border border-white/10 flex items-center justify-center text-secondary hover:text-main transition-colors"><User size={18} /></div>
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute top-12 right-0 w-80 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col items-center justify-center text-center pb-4 border-b border-white/5">
                <span className="text-secondary text-[13px] mb-3">{user?.email || 'user@graxion.in'}</span>
                
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.fullName || 'User'} className="w-20 h-20 rounded-full object-cover border border-white/10 mb-3" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-surface border border-white/10 flex items-center justify-center text-secondary mb-3"><User size={40} /></div>
                )}
                
                <h3 className="text-lg font-medium text-main">Hi, {user?.firstName || user?.fullName?.split(' ')[0] || 'User'}!</h3>
                
                <a 
                  href={authUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 px-4 py-1.5 rounded-full border border-white/20 text-main text-[14px] font-medium hover:bg-white/5 transition-colors"
                >
                  Manage your Graxion Account
                </a>
              </div>

              <div className="py-4">
                <h4 className="text-[12px] font-semibold text-secondary uppercase tracking-wider px-2 mb-3">Your Apps</h4>
                <div className="grid grid-cols-2 gap-2">
                  <a href={mailUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-colors gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Mail size={20} />
                    </div>
                    <span className="text-[13px] text-main font-medium">Mail</span>
                  </a>
                  <a href={aiUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-colors gap-2">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                      <Sparkles size={20} />
                    </div>
                    <span className="text-[13px] text-main font-medium">Ai</span>
                  </a>
                  <a href={flowUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-colors gap-2">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <Workflow size={20} />
                    </div>
                    <span className="text-[13px] text-main font-medium">Flow</span>
                  </a>
                  <a href={authUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-white/5 transition-colors gap-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                      <Shield size={20} />
                    </div>
                    <span className="text-[13px] text-main font-medium">Auth</span>
                  </a>
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-[14px] text-main hover:bg-white/5 hover:text-danger rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
