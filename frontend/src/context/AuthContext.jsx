import { createContext, useContext, useState, useEffect } from 'react';

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
          localStorage.setItem('graxion_access_token', tokenFromUrl);
          // Clean the URL
          params.delete('token');
          const cleanUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
          window.history.replaceState({}, document.title, cleanUrl);
        }

        // 2. Read token from localStorage
        const token = localStorage.getItem('graxion_access_token');
        if (!token) {
          setIsLoading(false);
          return; // No token — RequireAuth will handle the redirect
        }

        // 3. Decode and validate JWT structure (client-side check only)
        let decoded = null;
        try {
          const payloadBase64 = token.split('.')[1];
          decoded = JSON.parse(atob(payloadBase64));
        } catch {
          // Malformed token — clear and bail
          localStorage.removeItem('graxion_access_token');
          setIsLoading(false);
          return;
        }

        // 4. Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('graxion_access_token');
          setIsLoading(false);
          return;
        }

        // 5. Fetch profile data from Mail service (which proxies from Auth service)
        try {
          const profileRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/user/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            setUser({
              id: decoded.id,
              sessionId: decoded.sessionId,
              ...profileData.data // This will include avatar, fullName, email, etc.
            });
          } else {
             setUser({
               id: decoded.id,
               sessionId: decoded.sessionId,
             });
          }
        } catch (err) {
          console.error("Failed to fetch profile", err);
          setUser({
            id: decoded.id,
            sessionId: decoded.sessionId,
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthError('Authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
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
    const currentUrl = encodeURIComponent(window.location.origin);
    window.location.href = `${import.meta.env.VITE_AUTH_URL}/login?redirect_to=${currentUrl}&product=mail`;
  };

  const logout = () => {
    localStorage.removeItem('graxion_access_token');
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
