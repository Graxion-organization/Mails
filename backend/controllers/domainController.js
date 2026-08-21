import crypto from 'crypto';
import Domain from '../models/Domain.js';
import AuditLog from '../models/AuditLog.js';

/**
 * @desc    Add domain to organization
 * @route   POST /api/orgs/:orgId/domains
 */
export const addDomain = async (req, res) => {
  try {
    const { domain: domainName } = req.body;

    if (!domainName) {
      return res.status(400).json({ success: false, message: 'Domain name is required' });
    }

    // Normalize domain
    const normalized = domainName.toLowerCase().trim().replace(/^www\./, '');

    // Check if already exists
    const existing = await Domain.findOne({ domain: normalized });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Domain is already registered' });
    }

    // Generate verification token
    const verificationToken = `graxion-verify-${crypto.randomBytes(16).toString('hex')}`;

    const domain = await Domain.create({
      organization: req.params.orgId,
      domain: normalized,
      verification: {
        type: 'dns_txt',
        token: verificationToken,
      },
    });

    await AuditLog.create({
      organization: req.params.orgId,
      account: req.accountId,
      action: 'domain.added',
      target: { type: 'domain', id: domain._id.toString() },
      metadata: { domain: normalized },
    });

    res.status(201).json({
      success: true,
      message: 'Domain added. Please verify DNS records.',
      data: {
        domain,
        dnsInstructions: {
          txt: {
            type: 'TXT',
            host: `_graxion.${normalized}`,
            value: verificationToken,
            purpose: 'Domain verification',
          },
          mx: {
            type: 'MX',
            host: normalized,
            value: 'mx.graxion.in',
            priority: 10,
            purpose: 'Receive emails via Graxion',
          },
          spf: {
            type: 'TXT',
            host: normalized,
            value: 'v=spf1 include:spf.graxion.in ~all',
            purpose: 'SPF record for email authentication',
          },
        },
      },
    });
  } catch (error) {
    console.error('Add domain error:', error);
    res.status(500).json({ success: false, message: 'Error adding domain' });
  }
};

/**
 * @desc    List domains for organization
 * @route   GET /api/orgs/:orgId/domains
 */
export const listDomains = async (req, res) => {
  try {
    const domains = await Domain.find({
      organization: req.params.orgId,
      isActive: true,
    }).sort({ isPrimary: -1, createdAt: 1 });

    res.json({ success: true, data: domains });
  } catch (error) {
    console.error('List domains error:', error);
    res.status(500).json({ success: false, message: 'Error listing domains' });
  }
};

/**
 * @desc    Verify domain DNS
 * @route   POST /api/orgs/:orgId/domains/:domainId/verify
 */
export const verifyDomain = async (req, res) => {
  try {
    const domain = await Domain.findOne({
      _id: req.params.domainId,
      organization: req.params.orgId,
    });

    if (!domain) {
      return res.status(404).json({ success: false, message: 'Domain not found' });
    }

    // In production, we would DNS lookup to verify the TXT record
    // For development, we'll simulate verification
    domain.status = 'verified';
    domain.verification.verifiedAt = new Date();
    domain.dnsRecords.spf.configured = true;
    domain.dnsRecords.spf.lastChecked = new Date();
    domain.dnsRecords.mx.configured = true;
    domain.dnsRecords.mx.lastChecked = new Date();
    await domain.save();

    await AuditLog.create({
      organization: req.params.orgId,
      account: req.accountId,
      action: 'domain.verified',
      target: { type: 'domain', id: domain._id.toString() },
      metadata: { domain: domain.domain },
    });

    res.json({
      success: true,
      message: 'Domain verified successfully',
      data: domain,
    });
  } catch (error) {
    console.error('Verify domain error:', error);
    res.status(500).json({ success: false, message: 'Error verifying domain' });
  }
};

/**
 * @desc    Remove domain
 * @route   DELETE /api/orgs/:orgId/domains/:domainId
 */
export const removeDomain = async (req, res) => {
  try {
    await Domain.findOneAndUpdate(
      { _id: req.params.domainId, organization: req.params.orgId },
      { isActive: false }
    );

    res.json({ success: true, message: 'Domain removed' });
  } catch (error) {
    console.error('Remove domain error:', error);
    res.status(500).json({ success: false, message: 'Error removing domain' });
  }
};
