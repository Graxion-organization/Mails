import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema({
  account: {
    type: String,
    required: true, // Graxion Account ID
    index: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  mailbox: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mailbox',
    required: true,
  },

  // If replying to an existing thread
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Thread',
    default: null,
  },
  inReplyTo: String,

  // Addresses
  to: [{
    email: { type: String, lowercase: true },
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

  // Content
  subject: { type: String, default: '' },
  bodyHtml: { type: String, default: '' },
  bodyText: { type: String, default: '' },

  // Attachments (uploaded but not yet sent)
  attachments: [{
    id: String,
    filename: String,
    contentType: String,
    size: Number,
    public_id: String,
    url: String,
  }],

  // Scheduling
  scheduledAt: Date,

  // Auto-save tracking
  lastSavedAt: { type: Date, default: Date.now },
  saveCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

draftSchema.index({ account: 1, organization: 1, updatedAt: -1 });

const Draft = mongoose.model('Draft', draftSchema);

export default Draft;
