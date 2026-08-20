import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
    default: '',
  },
  company: {
    type: String,
    trim: true,
    default: null,
  },
  phone: {
    type: String,
    trim: true,
    default: null,
  },
  avatar: {
    type: String,
    default: null,
  },
  notes: {
    type: String,
    default: null,
  },
  tags: [String],
  
  // Stats
  lastEmailAt: Date,
  emailCount: { type: Number, default: 0 },
  
  // Source
  source: {
    type: String,
    enum: ['manual', 'auto', 'import'],
    default: 'auto',
  },
}, {
  timestamps: true,
});

contactSchema.index({ organization: 1, account: 1, email: 1 }, { unique: true });
contactSchema.index({ email: 'text', name: 'text' });

const Contact = mongoose.model('Contact', contactSchema);

export default Contact;
