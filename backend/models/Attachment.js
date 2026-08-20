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
  
  // R2 Storage
  r2Bucket: {
    type: String,
    required: true,
  },
  r2Key: {
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
attachmentSchema.index({ r2Key: 1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);

export default Attachment;
