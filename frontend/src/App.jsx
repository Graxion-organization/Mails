import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MailProvider, useMail } from './context/MailContext';
import { SocketProvider } from './context/SocketContext';
import { Loader2 } from 'lucide-react';

// Pages
import MailboxLayout from './components/layout/MailboxLayout';
import Landing from './pages/Landing';
import Inbox from './pages/Inbox';
import ThreadView from './pages/ThreadView';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';

function RequireAuth({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const { needsOnboarding, isLoading: mailLoading } = useMail();
  const location = useLocation();

  if (authLoading || mailLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (!user) {
    window.location.href = `${import.meta.env.VITE_AUTH_URL}/login`;
    return null;
  }

  // Redirect to onboarding if needed
  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  // Prevent accessing onboarding if not needed
  if (!needsOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/inbox" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      
      <Route path="/onboarding" element={
        <RequireAuth>
          <Onboarding />
        </RequireAuth>
      } />
      
      <Route element={
        <RequireAuth>
          <MailboxLayout />
        </RequireAuth>
      }>
        <Route path="/inbox" element={<Inbox folder="inbox" />} />
        <Route path="/sent" element={<Inbox folder="sent" />} />
        <Route path="/drafts" element={<Inbox folder="drafts" />} />
        <Route path="/archive" element={<Inbox folder="archive" />} />
        <Route path="/spam" element={<Inbox folder="spam" />} />
        <Route path="/trash" element={<Inbox folder="trash" />} />
        <Route path="/search" element={<Inbox mode="search" />} />
        
        <Route path="/thread/:threadId" element={<ThreadView />} />
        
        <Route path="/settings/*" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <MailProvider>
        <SocketProvider>
          <div className="app-container">
            <AppRoutes />
            <Toaster 
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#18181b',
                  color: '#fff',
                  border: '1px solid #27272a',
                },
              }}
            />
          </div>
        </SocketProvider>
      </MailProvider>
    </AuthProvider>
  );
}

export default App;


