import Mailbox from '../models/Mailbox.js';
import Domain from '../models/Domain.js';
import AuditLog from '../models/AuditLog.js';

/**
 * @desc    Create a mailbox
 * @route   POST /api/orgs/:orgId/mailboxes
 */
export const createMailbox = async (req, res) => {
  try {
    const { localPart, domainId, displayName, type = 'shared' } = req.body;

    if (!localPart || !domainId) {
      return res.status(400).json({ success: false, message: 'Local part and domain are required' });
    }

    const domain = await Domain.findOne({ _id: domainId, organization: req.params.orgId, status: 'verified' });
    if (!domain) {
      return res.status(400).json({ success: false, message: 'Domain not found or not verified' });
    }

    const address = `${localPart.toLowerCase().trim()}@${domain.domain}`;

    // Check if address exists
    const existing = await Mailbox.findOne({ address });
    if (existing) {
      if (existing.organization.toString() === req.params.orgId) {
        if (!existing.isActive) {
          // Reactivate it
          existing.isActive = true;
          existing.displayName = displayName || localPart;
          existing.type = type;
          existing.domain = domain._id;
          
          // Ensure current user is a member
          const isMember = existing.members.some(m => m.account.toString() === req.accountId);
          if (!isMember) {
            existing.members.push({ account: req.accountId, role: 'owner' });
          }
          
          await existing.save();
          
          await AuditLog.create({
            organization: req.params.orgId,
            account: req.accountId,
            action: 'mailbox.reactivated',
            target: { type: 'mailbox', id: existing._id.toString() },
            metadata: { address },
          });

          return res.status(200).json({ success: true, message: 'Mailbox restored successfully', data: existing });
        } else {
          return res.status(409).json({ success: false, message: 'This email address is already in use in your organization' });
        }
      } else {
        // Exists in a DIFFERENT organization.
        // Since the current org just proved ownership of the verified domain, they have the right to claim this address.
        // We orphan the old mailbox to free up the address for the rightful domain owner.
        existing.address = `${existing.address}_orphaned_${Date.now()}`;
        existing.isActive = false;
        await existing.save();
        // Proceed to create the new mailbox for the current org below
      }
    }

    const mailbox = await Mailbox.create({
      organization: req.params.orgId,
      domain: domain._id,
      address,
      localPart: localPart.toLowerCase().trim(),
      displayName: displayName || localPart,
      type,
      members: [{ account: req.accountId, role: 'owner' }],
    });

    await AuditLog.create({
      organization: req.params.orgId,
      account: req.accountId,
      action: 'mailbox.created',
      target: { type: 'mailbox', id: mailbox._id.toString() },
      metadata: { address },
    });

    res.status(201).json({
      success: true,
      message: 'Mailbox created successfully',
      data: mailbox,
    });
  } catch (error) {
    console.error('Create mailbox error:', error);
    res.status(500).json({ success: false, message: 'Error creating mailbox' });
  }
};

/**
 * @desc    List mailboxes for organization
 * @route   GET /api/orgs/:orgId/mailboxes
 */
export const listMailboxes = async (req, res) => {
  try {
    const query = { organization: req.params.orgId, isActive: true };

    // Non-admin users only see mailboxes they're members of
    if (!['owner', 'admin'].includes(req.member?.role)) {
      query['members.account'] = req.accountId;
    }

    console.log(`[DEBUG listMailboxes] Role: ${req.member?.role}, AccountId: ${req.accountId}, Query:`, query);

    const mailboxes = await Mailbox.find(query)
      .populate('domain', 'domain status')
      .sort({ type: 1, address: 1 });

    console.log(`[DEBUG listMailboxes] Returned ${mailboxes.length} mailboxes for AccountId: ${req.accountId}`);

    res.json({ success: true, data: mailboxes });
  } catch (error) {
    console.error('List mailboxes error:', error);
    res.status(500).json({ success: false, message: 'Error listing mailboxes' });
  }
};

/**
 * @desc    Update mailbox
 * @route   PUT /api/orgs/:orgId/mailboxes/:mailboxId
 */
export const updateMailbox = async (req, res) => {
  try {
    const { displayName, signature, autoReply, forwardTo } = req.body;
    const updates = {};
    if (displayName !== undefined) updates.displayName = displayName;
    if (signature) updates.signature = signature;
    if (autoReply) updates.autoReply = autoReply;
    if (forwardTo) updates.forwardTo = forwardTo;

    const mailbox = await Mailbox.findOneAndUpdate(
      { _id: req.params.mailboxId, organization: req.params.orgId },
      updates,
      { new: true }
    );

    if (!mailbox) {
      return res.status(404).json({ success: false, message: 'Mailbox not found' });
    }

    res.json({ success: true, data: mailbox });
  } catch (error) {
    console.error('Update mailbox error:', error);
    res.status(500).json({ success: false, message: 'Error updating mailbox' });
  }
};

/**
 * @desc    Delete (deactivate) mailbox
 * @route   DELETE /api/orgs/:orgId/mailboxes/:mailboxId
 */
export const deleteMailbox = async (req, res) => {
  try {
    await Mailbox.findOneAndUpdate(
      { _id: req.params.mailboxId, organization: req.params.orgId },
      { isActive: false }
    );

    res.json({ success: true, message: 'Mailbox deactivated' });
  } catch (error) {
    console.error('Delete mailbox error:', error);
    res.status(500).json({ success: false, message: 'Error deleting mailbox' });
  }
};
