import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MailProvider, useMail } from './context/MailContext';
import { SocketProvider } from './context/SocketContext';
import { Loader2, AlertTriangle } from 'lucide-react';

// Pages
import MailboxLayout from './components/layout/MailboxLayout';
import Landing from './pages/Landing';
import Inbox from './pages/Inbox';
import ThreadView from './pages/ThreadView';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';

function RequireAuth({ children }) {
  const { user, isLoading: authLoading, authError, redirectToAuth } = useAuth();
  const { needsOnboarding, isLoading: mailLoading } = useMail();
  const location = useLocation();

  if (authLoading || mailLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  // If there's an auth error (loop detected), show a manual login prompt
  if (authError) {
    return (
      <div className="auth-error-screen" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fff', gap: '20px', padding: '20px', textAlign: 'center' }}>
        <AlertTriangle size={48} color="#f59e0b" />
        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Authentication Required</h2>
        <p style={{ color: '#a1a1aa', fontSize: '14px', maxWidth: '400px' }}>
          {authError}
        </p>
        <a
          href={`${import.meta.env.VITE_AUTH_URL}/login?redirect_to=${encodeURIComponent(window.location.origin)}&product=mail`}
          className="btn-primary"
          style={{ textDecoration: 'none' }}
        >
          Go to Login
        </a>
      </div>
    );
  }

  if (!user) {
    // Use the controlled redirect with loop protection
    redirectToAuth();
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
        <Loader2 className="animate-spin" size={32} />
        <span style={{ marginLeft: '12px', color: '#a1a1aa' }}>Redirecting to login...</span>
      </div>
    );
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

function HomeRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff' }}>
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  // If user is authenticated, skip landing and go to inbox
  if (user) {
    return <Navigate to="/inbox" replace />;
  }

  // Otherwise show landing page
  return <Landing />;
}

function NotFound() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#09090b', color: '#fff', gap: '16px' }}>
      <h1 style={{ fontSize: '48px', margin: 0 }}>404</h1>
      <p style={{ color: '#a1a1aa' }}>Page not found.</p>
      <a href="/" className="btn-primary" style={{ textDecoration: 'none', marginTop: '16px' }}>Return Home</a>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      
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
      
      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
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
