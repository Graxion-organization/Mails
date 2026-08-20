import mongoose from 'mongoose';

const mailboxSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  domain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Domain',
    required: true,
  },
  
  // Email Address
  address: {
    type: String,
    required: [true, 'Email address is required'],
    lowercase: true,
    trim: true,
    unique: true,
  },
  localPart: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    trim: true,
    default: null,
  },

  // Type
  type: {
    type: String,
    enum: ['personal', 'shared', 'group', 'alias'],
    default: 'shared',
  },

  // For alias/group: forward to these addresses
  forwardTo: [{
    type: String,
    lowercase: true,
    trim: true,
  }],

  // Members with access to this mailbox
  members: [{
    account: { type: String, required: true }, // Graxion Account ID
    role: {
      type: String,
      enum: ['owner', 'agent', 'viewer'],
      default: 'agent',
    },
    addedAt: { type: Date, default: Date.now },
  }],

  // Signature
  signature: {
    html: { type: String, default: '' },
    plainText: { type: String, default: '' },
  },

  // Auto-Reply / Out of Office
  autoReply: {
    enabled: { type: Boolean, default: false },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    startDate: Date,
    endDate: Date,
  },

  // Stats
  unreadCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },

  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

mailboxSchema.index({ organization: 1, address: 1 });
mailboxSchema.index({ address: 1 }, { unique: true });
mailboxSchema.index({ 'members.account': 1 });

const Mailbox = mongoose.model('Mailbox', mailboxSchema);

export default Mailbox;
