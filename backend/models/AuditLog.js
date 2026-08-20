import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
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
  action: {
    type: String,
    required: true,
    // e.g. 'message.sent', 'member.added', 'mailbox.created', 'domain.verified', etc.
  },
  target: {
    type: { type: String }, // 'message', 'mailbox', 'member', 'domain', etc.
    id: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ip: String,
  userAgent: String,
}, {
  timestamps: true,
});

// Auto-delete after 365 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });
auditLogSchema.index({ organization: 1, createdAt: -1 });
auditLogSchema.index({ organization: 1, action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
