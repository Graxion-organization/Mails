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
    <div className="mail-layout-container">
      {/* Mobile overlay */}
      <div 
        className={`mobile-overlay ${isMobileSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      ></div>

      <Sidebar isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />
      
      <div className="mail-layout-main">
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <div className="mail-layout-content">
          <Outlet />
        </div>
      </div>
      
      {isComposerOpen && <Composer />}
    </div>
  );
}
