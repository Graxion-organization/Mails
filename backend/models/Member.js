import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  account: {
    type: String,
    required: true, // Graxion Account ID
  },

  // Role
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'support_agent', 'billing', 'member'],
    default: 'member',
  },

  // Mailbox-level access (for non-owner/admin roles)
  mailboxAccess: [{
    mailbox: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mailbox',
    },
    role: {
      type: String,
      enum: ['agent', 'viewer'],
      default: 'agent',
    },
  }],

  // Invitation
  invitedBy: String,
  invitedEmail: {
    type: String,
    lowercase: true,
    trim: true,
  },
  inviteToken: String,
  inviteExpiresAt: Date,

  // Status
  status: {
    type: String,
    enum: ['active', 'invited', 'suspended', 'removed'],
    default: 'invited',
  },
  joinedAt: Date,
  removedAt: Date,

  // Preferences
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    desktopNotifications: { type: Boolean, default: true },
  },
}, {
  timestamps: true,
});

memberSchema.index({ organization: 1, account: 1 }, { unique: true });
memberSchema.index({ account: 1 });
memberSchema.index({ inviteToken: 1 });

const Member = mongoose.model('Member', memberSchema);

export default Member;
