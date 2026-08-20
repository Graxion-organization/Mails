import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import connectDB from './config/db.js';
import { initSocket } from './sockets/socketHandler.js';

// Routes
import orgRoutes from './routes/orgRoutes.js';
import domainRoutes from './routes/domainRoutes.js';
import mailboxRoutes from './routes/mailboxRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import threadRoutes from './routes/threadRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import draftRoutes from './routes/draftRoutes.js';
import labelRoutes from './routes/labelRoutes.js';
import filterRoutes from './routes/filterRoutes.js';
import signatureRoutes from './routes/signatureRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import attachmentRoutes from './routes/attachmentRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Load env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Connect DB
connectDB();

const app = express();

// CORS — Allow all Graxion products
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
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error('CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit
app.use('/api', apiLimiter);

// ── API Routes ──
// Organization management
app.use('/api/orgs', orgRoutes);
app.use('/api/orgs/:orgId/domains', domainRoutes);
app.use('/api/orgs/:orgId/mailboxes', mailboxRoutes);
app.use('/api/orgs/:orgId/members', memberRoutes);

// Mail operations
app.use('/api/mail/threads', threadRoutes);
app.use('/api/mail', messageRoutes);
app.use('/api/mail/drafts', draftRoutes);
app.use('/api/mail/labels', labelRoutes);
app.use('/api/mail/filters', filterRoutes);
app.use('/api/mail/signatures', signatureRoutes);
app.use('/api/mail/templates', templateRoutes);
app.use('/api/mail/contacts', contactRoutes);
app.use('/api/mail/attachments', attachmentRoutes);
app.use('/api/mail/search', searchRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Webhooks (no auth required)
app.use('/api/webhooks', webhookRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Graxion Mail Service is running',
    service: 'graxion-mail',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('❌ Error:', err.stack);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 25MB.',
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 6002;

server.listen(PORT, () => {
  console.log(`\n📬 ══════════════════════════════════════════`);
  console.log(`   Graxion Mail Service running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`📬 ══════════════════════════════════════════\n`);
});
