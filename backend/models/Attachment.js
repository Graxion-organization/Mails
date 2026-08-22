import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  uploadedBy: {
    type: String, // Graxion Account ID
    default: null,
  },
  
  // File info
  filename: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  
  // Cloudinary Storage
  public_id: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  
  // Checksum
  checksum: String,
  
  // Status
  status: {
    type: String,
    enum: ['uploading', 'ready', 'deleted'],
    default: 'ready',
  },
}, {
  timestamps: true,
});

attachmentSchema.index({ message: 1 });
attachmentSchema.index({ organization: 1, uploadedBy: 1 });
attachmentSchema.index({ public_id: 1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);

export default Attachment;
