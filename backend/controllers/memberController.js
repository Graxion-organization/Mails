import crypto from 'crypto';
import Member from '../models/Member.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';

/**
 * @desc    Invite a member to the organization
 * @route   POST /api/orgs/:orgId/members/invite
 */
export const inviteMember = async (req, res) => {
  try {
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if already a member
    const existing = await Member.findOne({
      organization: req.params.orgId,
      invitedEmail: email.toLowerCase(),
      status: { $in: ['active', 'invited'] },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'User is already a member or invited' });
    }

    // Can't assign a role higher than your own
    const roleHierarchy = ['member', 'billing', 'support_agent', 'manager', 'admin', 'owner'];
    const inviterLevel = roleHierarchy.indexOf(req.member.role);
    const inviteeLevel = roleHierarchy.indexOf(role);
    if (inviteeLevel >= inviterLevel) {
      return res.status(403).json({ success: false, message: 'Cannot assign a role equal to or higher than your own' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');

    const member = await Member.create({
      organization: req.params.orgId,
      account: '', // Will be set when they accept
      role,
      invitedBy: req.accountId,
      invitedEmail: email.toLowerCase(),
      inviteToken,
      inviteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'invited',
    });

    await AuditLog.create({
      organization: req.params.orgId,
      account: req.accountId,
      action: 'member.invited',
      target: { type: 'member', id: member._id.toString() },
      metadata: { email, role },
    });

    // TODO: Send invitation email via Resend

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${email}`,
      data: { id: member._id, email, role, status: 'invited' },
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ success: false, message: 'Error inviting member' });
  }
};

/**
 * @desc    List org members
 * @route   GET /api/orgs/:orgId/members
 */
export const listMembers = async (req, res) => {
  try {
    const members = await Member.find({
      organization: req.params.orgId,
      status: { $in: ['active', 'invited'] },
    }).sort({ role: 1, createdAt: 1 });

    res.json({ success: true, data: members });
  } catch (error) {
    console.error('List members error:', error);
    res.status(500).json({ success: false, message: 'Error listing members' });
  }
};

/**
 * @desc    Change member role
 * @route   PUT /api/orgs/:orgId/members/:memberId/role
 */
export const changeMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ['admin', 'manager', 'support_agent', 'billing', 'member'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const member = await Member.findOneAndUpdate(
      { _id: req.params.memberId, organization: req.params.orgId },
      { role },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    await AuditLog.create({
      organization: req.params.orgId,
      account: req.accountId,
      action: 'member.role_changed',
      target: { type: 'member', id: member._id.toString() },
      metadata: { newRole: role },
    });

    res.json({ success: true, data: member });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ success: false, message: 'Error changing member role' });
  }
};

/**
 * @desc    Remove member
 * @route   DELETE /api/orgs/:orgId/members/:memberId
 */
export const removeMember = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.memberId,
      organization: req.params.orgId,
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    if (member.role === 'owner') {
      return res.status(403).json({ success: false, message: 'Cannot remove the organization owner' });
    }

    member.status = 'removed';
    member.removedAt = new Date();
    await member.save();

    await AuditLog.create({
      organization: req.params.orgId,
      account: req.accountId,
      action: 'member.removed',
      target: { type: 'member', id: member._id.toString() },
    });

    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ success: false, message: 'Error removing member' });
  }
};
