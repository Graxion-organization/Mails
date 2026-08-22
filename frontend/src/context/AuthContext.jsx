import { createContext, useContext, useState, useEffect } from 'react';

import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Key used to prevent redirect loops
const REDIRECT_GUARD_KEY = 'graxion_auth_redirect_ts';
const REDIRECT_COOLDOWN_MS = 10000; // 10 second cooldown between redirects

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check for token passed via URL from Auth service
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');

        if (tokenFromUrl) {
          try {
            await api.post('/user/set-session', { token: tokenFromUrl });
            // Notify other tabs to reload
            localStorage.setItem('graxion_auth_sync', Date.now().toString());
          } catch (err) {
            console.error('Failed to set session', err);
          }
          // Clean the URL
          params.delete('token');
          let cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
          window.history.replaceState({}, document.title, cleanUrl);
        }

        // 2. Fetch profile data from Mail service
        // The Mail backend will use the HttpOnly cookie we just set (or already had)
        try {
          const profileRes = await api.get('/user/me');
          
          setUser({
            id: profileRes.data.id || profileRes.data.data?.id,
            ...profileRes.data.data
          });
          
          // Check if we had a pending redirect
          const pendingRedirect = sessionStorage.getItem('graxion_post_auth_redirect');
          if (pendingRedirect) {
            sessionStorage.removeItem('graxion_post_auth_redirect');
            if (window.location.pathname + window.location.search !== pendingRedirect) {
              window.location.href = pendingRedirect;
            }
          }
        } catch (err) {
          console.error("Failed to fetch profile (No valid session)", err);
          setUser(null);
          // Do not redirect here, RequireAuth will handle it if user is null
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for cross-tab token changes
    const handleStorageChange = (e) => {
      if (e.key === 'graxion_auth_sync') {
        if (e.oldValue !== e.newValue) {
          // Auth state changed in another tab, reload the app to sync
          window.location.reload();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const redirectToAuth = () => {
    // Guard against redirect loops — if we redirected less than 10s ago, don't redirect again
    const lastRedirect = sessionStorage.getItem(REDIRECT_GUARD_KEY);
    if (lastRedirect && Date.now() - parseInt(lastRedirect) < REDIRECT_COOLDOWN_MS) {
      console.warn('Redirect loop detected — suppressing redirect to Auth');
      setAuthError('Unable to authenticate. Please try logging in manually.');
      return;
    }

    sessionStorage.setItem(REDIRECT_GUARD_KEY, Date.now().toString());
    sessionStorage.setItem('graxion_post_auth_redirect', window.location.pathname + window.location.search);
    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `${import.meta.env.VITE_AUTH_URL}/login?redirect_to=${currentUrl}&product=mail`;
  };

  const logout = async () => {
    try {
      await api.post('/user/logout');
    } catch (err) {
      console.error('Logout error', err);
    }
    localStorage.setItem('graxion_auth_sync', Date.now().toString());
    sessionStorage.removeItem(REDIRECT_GUARD_KEY);
    setUser(null);
    window.location.href = `${import.meta.env.VITE_AUTH_URL}/login`;
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, redirectToAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
