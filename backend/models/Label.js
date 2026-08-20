import mongoose from 'mongoose';

const labelSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Label name is required'],
    trim: true,
    maxlength: [50, 'Label name cannot exceed 50 characters'],
  },
  color: {
    type: String,
    default: '#8b5cf6', // Graxion purple
  },
  icon: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    enum: ['system', 'custom'],
    default: 'custom',
  },
  scope: {
    type: String,
    enum: ['org', 'personal'],
    default: 'personal',
  },
  account: {
    type: String, // For personal labels
    default: null,
  },
  threadCount: {
    type: Number,
    default: 0,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

labelSchema.index({ organization: 1, account: 1 });
labelSchema.index({ organization: 1, type: 1 });

const Label = mongoose.model('Label', labelSchema);

export default Label;
