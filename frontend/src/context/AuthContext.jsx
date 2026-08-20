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
        // We assume the cookie 'graxion_access_token' is already set by Graxion Auth
        // Or we redirect to Graxion Auth to login
        
        // Mocking user for development
        setUser({
          id: 'acc_123456789',
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
