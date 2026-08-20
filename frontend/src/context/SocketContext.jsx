import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useMail } from './MailContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { activeOrg, activeMailbox, setStats } = useMail();
  const [socket, setSocket] = useState(null);
  
  // Track collision presence per thread
  const [threadPresence, setThreadPresence] = useState({});

  useEffect(() => {
    if (!user) return;

    // Connect to Socket.io backend
    // It relies on cookies (graxion_access_token) for auth
    const socketInstance = io(import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:6002', {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('🔌 Connected to real-time server');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socketInstance.on('thread:viewing', ({ userId, status, threadId }) => {
      if (userId === user.id) return; // ignore self
      
      setThreadPresence(prev => {
        const current = prev[threadId] || [];
        if (status === 'viewing') {
          if (!current.includes(userId)) return { ...prev, [threadId]: [...current, userId] };
        } else if (status === 'left') {
          return { ...prev, [threadId]: current.filter(id => id !== userId) };
        }
        return prev;
      });
    });
    
    socketInstance.on('note:added', ({ threadId }) => {
       // Optional: could toast if you're not in the thread, but mostly handled by ThreadView
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Handle room joining when active items change
  useEffect(() => {
    if (socket && activeOrg) {
      socket.emit('join_org', activeOrg._id);
    }
  }, [socket, activeOrg]);

  useEffect(() => {
    if (socket && activeMailbox) {
      socket.emit('join_mailbox', activeMailbox._id);
    }
  }, [socket, activeMailbox]);

  const joinThread = (threadId) => {
    if (socket) socket.emit('thread:join', threadId);
  };

  const leaveThread = (threadId) => {
    if (socket) socket.emit('thread:leave', threadId);
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      joinThread, 
      leaveThread, 
      threadPresence 
    }}>
      {children}
    </SocketContext.Provider>
  );
};
