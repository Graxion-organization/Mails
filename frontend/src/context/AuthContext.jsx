import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch from Graxion Central Auth
    // For now, we mock the user context based on the shared secret auth pattern
    const fetchUser = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const tokenFromUrl = params.get('token');
        
        if (tokenFromUrl) {
          localStorage.setItem('graxion_access_token', tokenFromUrl);
          params.delete('token');
          const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
          window.history.replaceState({}, document.title, newUrl);
        }

        const token = localStorage.getItem('graxion_access_token');
        if (!token) {
          setLoading(false);
          return; // No user, let App.jsx redirect to Auth
        }

        let decoded = null;
        try {
          const payloadBase64 = token.split('.')[1];
          decoded = JSON.parse(atob(payloadBase64));
        } catch (e) {
          console.error('Failed to parse token');
        }
        
        // Mocking user for development, but with real ID for backend sync
        setUser({
          id: decoded?.id || 'acc_123456789',
          name: 'Demo User',
          email: 'demo@graxion.in',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Demo',
        });
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = () => {
    window.location.href = `${import.meta.env.VITE_AUTH_URL}/login?redirect=${encodeURIComponent(window.location.href)}`;
  };

  const logout = () => {
    // Implementation would call Graxion Auth logout endpoint
    setUser(null);
    window.location.href = `${import.meta.env.VITE_AUTH_URL}/login`;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
