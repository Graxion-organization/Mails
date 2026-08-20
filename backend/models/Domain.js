import mongoose from 'mongoose';

const domainSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  domain: {
    type: String,
    required: [true, 'Domain name is required'],
    lowercase: true,
    trim: true,
    unique: true,
  },
  
  // Verification
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending',
  },
  verification: {
    type: {
      type: String,
      enum: ['dns_txt', 'cname'],
      default: 'dns_txt',
    },
    token: String,
    verifiedAt: Date,
  },

  // DNS Records Status
  dnsRecords: {
    spf: {
      configured: { type: Boolean, default: false },
      value: String,
      lastChecked: Date,
    },
    dkim: {
      configured: { type: Boolean, default: false },
      selector: String,
      value: String,
      lastChecked: Date,
    },
    dmarc: {
      configured: { type: Boolean, default: false },
      value: String,
      lastChecked: Date,
    },
    mx: {
      configured: { type: Boolean, default: false },
      value: String,
      lastChecked: Date,
    },
  },

  // Resend Integration
  resendDomainId: {
    type: String,
    default: null,
  },

  // Flags
  isPrimary: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

domainSchema.index({ organization: 1, domain: 1 });
domainSchema.index({ domain: 1 }, { unique: true });

const Domain = mongoose.model('Domain', domainSchema);

export default Domain;
