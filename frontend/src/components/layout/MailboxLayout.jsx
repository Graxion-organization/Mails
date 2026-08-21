import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Composer from '../mail/Composer';
import { useMail } from '../../context/MailContext';

export default function MailboxLayout() {
  const { isComposerOpen } = useMail();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-bg overflow-hidden text-main">
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      ></div>

      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      
      <div className="flex flex-col flex-1 min-w-0">
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <Outlet />
        </div>
      </div>
      
      {isComposerOpen && <Composer />}
    </div>
  );
}
