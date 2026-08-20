import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['new_email', 'assignment', 'mention', 'reply', 'system', 'invite'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    default: '',
  },
  link: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ account: 1, isRead: 1, createdAt: -1 });
// Auto-delete after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
