import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  createdBy: {
    type: String,
    required: true, // Graxion Account ID
  },
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
  },
  subject: {
    type: String,
    default: '',
  },
  bodyHtml: {
    type: String,
    default: '',
  },
  bodyText: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    default: 'General',
    trim: true,
  },
  variables: [String], // e.g., ['{{name}}', '{{company}}']
  isShared: {
    type: Boolean,
    default: true,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

templateSchema.index({ organization: 1, createdBy: 1 });

const Template = mongoose.model('Template', templateSchema);

export default Template;
