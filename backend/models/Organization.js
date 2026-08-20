import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: null,
  },
  logo: {
    type: String,
    default: null,
  },

  // Owner (Graxion Account ID)
  owner: {
    type: String,
    required: true,
    index: true,
  },

  // Plan & Limits
  plan: {
    type: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    limits: {
      maxMailboxes: { type: Number, default: 5 },
      maxMembers: { type: Number, default: 10 },
      maxDomains: { type: Number, default: 2 },
      maxStorageGB: { type: Number, default: 5 },
      maxEmailsPerDay: { type: Number, default: 200 },
    },
  },

  // Settings
  settings: {
    defaultSignatureId: { type: mongoose.Schema.Types.ObjectId, default: null },
    retentionDays: { type: Number, default: 365 },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    autoCreateContacts: { type: Boolean, default: true },
    defaultReplyBehavior: {
      type: String,
      enum: ['reply', 'reply_all'],
      default: 'reply',
    },
  },

  // Usage
  storageUsedBytes: { type: Number, default: 0 },
  emailsSentToday: { type: Number, default: 0 },
  emailsSentTodayReset: { type: Date, default: Date.now },
  totalEmailsSent: { type: Number, default: 0 },
  totalEmailsReceived: { type: Number, default: 0 },

  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active',
  },
  suspendedReason: String,
  deletedAt: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

organizationSchema.index({ owner: 1 });
organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ status: 1 });

const Organization = mongoose.model('Organization', organizationSchema);

export default Organization;
