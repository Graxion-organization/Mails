import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    required: true,
    index: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  mailbox: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mailbox',
    required: true,
  },

  // RFC 2822 Message-ID for threading
  messageId: {
    type: String,
    unique: true,
    sparse: true,
  },
  inReplyTo: String,
  references: [String],

  // Addresses
  from: {
    email: { type: String, required: true, lowercase: true },
    name: { type: String, default: '' },
  },
  to: [{
    email: { type: String, required: true, lowercase: true },
    name: { type: String, default: '' },
  }],
  cc: [{
    email: { type: String, lowercase: true },
    name: { type: String, default: '' },
  }],
  bcc: [{
    email: { type: String, lowercase: true },
    name: { type: String, default: '' },
  }],
  replyTo: {
    email: { type: String, lowercase: true },
    name: { type: String, default: '' },
  },

  // Content
  subject: { type: String, default: '(No Subject)' },
  bodyHtml: { type: String, default: '' },
  bodyText: { type: String, default: '' },
  snippet: { type: String, default: '' },

  // Attachments (metadata — actual files in R2)
  attachments: [{
    id: String,
    filename: String,
    contentType: String,
    size: Number,
    public_id: String,
    url: String,
  }],

  // Direction & Status
  direction: {
    type: String,
    enum: ['inbound', 'outbound'],
    required: true,
  },
  status: {
    type: String,
    enum: ['queued', 'sending', 'sent', 'delivered', 'bounced', 'failed', 'scheduled', 'cancelled'],
    default: 'sent',
  },
  scheduledAt: Date,
  sentAt: Date,

  // Resend tracking
  resendMessageId: String,
  resendStatus: String,

  // Headers (raw)
  headers: {
    type: Map,
    of: String,
    default: {},
  },

  // Spam Analysis
  spamAnalysis: {
    score: { type: Number, default: 0 },
    isSpam: { type: Boolean, default: false },
    reasons: [String],
    spfPass: Boolean,
    dkimPass: Boolean,
    dmarcPass: Boolean,
  },

  // Internal Notes (for shared inboxes)
  internalNotes: [{
    author: String, // Account ID
    authorName: String,
    text: String,
    createdAt: { type: Date, default: Date.now },
  }],

  // Read tracking
  readBy: [{
    account: String,
    readAt: { type: Date, default: Date.now },
  }],

  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
}, {
  timestamps: true,
});

// Text search index
messageSchema.index({ subject: 'text', bodyText: 'text', snippet: 'text' });
messageSchema.index({ thread: 1, createdAt: 1 });
messageSchema.index({ organization: 1, mailbox: 1, createdAt: -1 });
messageSchema.index({ messageId: 1 });
messageSchema.index({ 'from.email': 1 });
messageSchema.index({ scheduledAt: 1, status: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
