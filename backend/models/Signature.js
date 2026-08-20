import mongoose from 'mongoose';

const signatureSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: [true, 'Signature name is required'],
    trim: true,
  },
  bodyHtml: {
    type: String,
    default: '',
  },
  bodyText: {
    type: String,
    default: '',
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

signatureSchema.index({ account: 1, organization: 1 });

const Signature = mongoose.model('Signature', signatureSchema);

export default Signature;
