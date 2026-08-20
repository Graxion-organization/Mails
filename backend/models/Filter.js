import mongoose from 'mongoose';

const filterSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: [true, 'Filter name is required'],
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },

  // Conditions (all must match)
  conditions: {
    from: { type: String, default: null },       // contains
    to: { type: String, default: null },         // contains
    subject: { type: String, default: null },    // contains
    body: { type: String, default: null },       // contains
    hasAttachment: { type: Boolean, default: null },
    sizeGreaterThan: { type: Number, default: null }, // bytes
    sizeLessThan: { type: Number, default: null },
  },

  // Actions to perform
  actions: {
    addLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Label',
      default: null,
    },
    removeLabel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Label',
      default: null,
    },
    markAsRead: { type: Boolean, default: false },
    archive: { type: Boolean, default: false },
    star: { type: Boolean, default: false },
    markImportant: { type: Boolean, default: false },
    moveToFolder: {
      type: String,
      enum: ['inbox', 'archive', 'spam', 'trash', null],
      default: null,
    },
    forwardTo: { type: String, default: null },
    category: {
      type: String,
      enum: ['primary', 'social', 'promotions', 'updates', 'forums', null],
      default: null,
    },
  },

  // Execution order (lower = first)
  priority: {
    type: Number,
    default: 0,
  },

  // Stats
  matchCount: { type: Number, default: 0 },
  lastMatchAt: Date,
}, {
  timestamps: true,
});

filterSchema.index({ organization: 1, account: 1, isActive: 1, priority: 1 });

const Filter = mongoose.model('Filter', filterSchema);

export default Filter;
