import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema({
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
    index: true,
  },
  
  // Thread Info
  subject: {
    type: String,
    default: '(No Subject)',
    trim: true,
  },
  snippet: {
    type: String,
    default: '',
  },
  
  // Participants
  participants: [{
    email: { type: String, lowercase: true },
    name: String,
  }],

  // Message tracking
  messageCount: { type: Number, default: 0 },
  lastMessageAt: { type: Date, default: Date.now },
  firstMessageAt: { type: Date, default: Date.now },

  // Labels & Categories
  labels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Label',
  }],
  category: {
    type: String,
    enum: ['primary', 'social', 'promotions', 'updates', 'forums', 'other'],
    default: 'primary',
  },

  // Flags per user
  userFlags: [{
    account: String,
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    isImportant: { type: Boolean, default: false },
  }],

  // Folder
  folder: {
    type: String,
    enum: ['inbox', 'sent', 'drafts', 'archive', 'spam', 'trash'],
    default: 'inbox',
    index: true,
  },

  // Shared Inbox Fields
  status: {
    type: String,
    enum: ['open', 'pending', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  assignedTo: {
    type: String, // Graxion Account ID
    default: null,
  },
  tags: [String],

  // Spam
  spamScore: { type: Number, default: 0 },
  isSpam: { type: Boolean, default: false },

  // Soft delete
  trashedAt: Date,
  deletedAt: Date,
}, {
  timestamps: true,
});

// Text search index
threadSchema.index({ subject: 'text', snippet: 'text' });
threadSchema.index({ organization: 1, mailbox: 1, folder: 1, lastMessageAt: -1 });
threadSchema.index({ organization: 1, folder: 1, lastMessageAt: -1 });
threadSchema.index({ 'userFlags.account': 1 });
threadSchema.index({ assignedTo: 1 });
threadSchema.index({ trashedAt: 1 });

const Thread = mongoose.model('Thread', threadSchema);

export default Thread;
