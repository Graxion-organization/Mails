import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (server) => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.AUTH_URL,
    process.env.GRAXION_MAIN_URL,
    process.env.FLOW_URL,
    process.env.AI_URL,
    'https://mail.graxion.in',
    'https://accounts.graxion.in',
    'https://graxion.in',
    'https://www.graxion.in',
    'https://flow.graxion.in',
    'https://ai.graxion.in',
    'http://localhost:5177',
    'http://localhost:5175'
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    // Attempt to parse cookie for graxion_access_token
    const cookieHeader = socket.request.headers.cookie;
    if (!cookieHeader) {
      return next(new Error('Authentication error'));
    }

    const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('graxion_access_token='));
    if (!tokenCookie) {
      return next(new Error('Authentication error'));
    }

    const token = tokenCookie.split('=')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.GRAXION_AUTH_JWT_SECRET || 'dev_jwt_secret');
      socket.user = decoded; // { id, type }
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🟢 Socket connected: ${socket.id} (User: ${socket.user.id})`);

    // Join personal room for direct notifications
    socket.join(`user:${socket.user.id}`);

    // Join organization or mailbox rooms based on frontend request
    socket.on('join_org', (orgId) => {
      socket.join(`org:${orgId}`);
      console.log(`User ${socket.user.id} joined org:${orgId}`);
    });

    socket.on('join_mailbox', (mailboxId) => {
      socket.join(`mailbox:${mailboxId}`);
    });

    // Thread View Collision Detection
    socket.on('thread:join', (threadId) => {
      socket.join(`thread:${threadId}`);
      // Broadcast that this user is viewing the thread
      socket.to(`thread:${threadId}`).emit('thread:viewing', {
        userId: socket.user.id,
        status: 'viewing',
        threadId,
      });
    });

    socket.on('thread:leave', (threadId) => {
      socket.leave(`thread:${threadId}`);
      socket.to(`thread:${threadId}`).emit('thread:viewing', {
        userId: socket.user.id,
        status: 'left',
        threadId,
      });
    });

    socket.on('thread:typing', ({ threadId, isTyping }) => {
      socket.to(`thread:${threadId}`).emit('thread:typing', {
        userId: socket.user.id,
        isTyping,
        threadId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔴 Socket disconnected: ${socket.id}`);
      // Thread leave events are implicitly handled by the client before disconnect
      // Or we can rely on standard disconnect logic
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
