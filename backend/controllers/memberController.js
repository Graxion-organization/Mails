import crypto from 'crypto';
import Member from '../models/Member.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import Organization from '../models/Organization.js';
import getResend from '../config/resend.js';

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
      account: `pending_${crypto.randomBytes(8).toString('hex')}`, // Will be updated to their real account ID when they accept
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

    // Send invitation email via Resend
    try {
      const org = await Organization.findById(req.params.orgId);
      const resend = getResend();
      const inviteUrl = `${process.env.CLIENT_URL}/invite?inviteToken=${inviteToken}`;
      
      await resend.emails.send({
        from: 'Graxion Mail <noreply@graxion.in>',
        to: email,
        subject: `You have been invited to join ${org?.name || 'an organization'} on Graxion Mail`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Invitation to join Graxion Mail</h2>
            <p>You have been invited to join <strong>${org?.name || 'an organization'}</strong> as a <strong>${role}</strong>.</p>
            <p>Please click the link below to accept the invitation:</p>
            <a href="${inviteUrl}" style="display: inline-block; padding: 10px 20px; background-color: #a855f7; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">Accept Invitation</a>
            <p style="color: #666; font-size: 12px;">This invitation will expire in 7 days.</p>
          </div>
        `
      });
    } catch (emailErr) {
      console.error('Failed to send invite email:', emailErr);
      // We continue since the invite was created in DB
    }

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
      status: { $in: ['active', 'invited', 'pending_approval'] },
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

/**
 * @desc    Accept an invitation
 * @route   POST /api/orgs/members/accept-invite
 */
export const acceptInvite = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Invite token is required' });
    }

    const member = await Member.findOne({
      inviteToken: token,
      status: 'invited',
      inviteExpiresAt: { $gt: new Date() }
    });

    if (!member) {
      return res.status(400).json({ success: false, message: 'Invalid or expired invitation' });
    }

    // A user might be accepting this with a different email than they were invited with,
    // but they must be logged into a valid Graxion account (req.accountId).
    
    // Check if they were previously a member and got removed (soft deleted)
    const existingMember = await Member.findOne({
      organization: member.organization,
      account: req.accountId,
    });

    if (existingMember) {
      if (existingMember.status === 'removed') {
        // Delete the old removed record so the unique index (org, account) doesn't conflict
        await Member.deleteOne({ _id: existingMember._id });
      } else {
        return res.status(400).json({ success: false, message: 'You are already a member of this organization.' });
      }
    }

    member.account = req.accountId;
    member.status = 'pending_approval';
    member.inviteToken = undefined;
    member.inviteExpiresAt = undefined;
    await member.save();

    await AuditLog.create({
      organization: member.organization,
      account: req.accountId,
      action: 'member.invite_accepted',
      target: { type: 'member', id: member._id.toString() },
    });

    res.json({ success: true, message: 'Invitation accepted. Pending admin approval.' });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ success: false, message: 'Error accepting invitation' });
  }
};

/**
 * @desc    Approve a pending member
 * @route   POST /api/orgs/:orgId/members/:memberId/approve
 */
export const approveMember = async (req, res) => {
  try {
    const member = await Member.findOne({
      _id: req.params.memberId,
      organization: req.params.orgId,
      status: 'pending_approval'
    });

    if (!member) {
      return res.status(404).json({ success: false, message: 'Pending member not found' });
    }

    member.status = 'active';
    member.joinedAt = new Date();
    await member.save();

    try {
      const { getIO } = await import('../sockets/socketHandler.js');
      const io = getIO();
      io.to(`user:${member.account}`).emit('org_membership_updated', {
        orgId: req.params.orgId,
        status: 'active'
      });
    } catch (err) {
      console.error('Socket emit error:', err);
    }

    await AuditLog.create({
      organization: req.params.orgId,
      account: req.accountId,
      action: 'member.approved',
      target: { type: 'member', id: member._id.toString() },
    });

    res.json({ success: true, message: 'Member approved successfully' });
  } catch (error) {
    console.error('Approve member error:', error);
    res.status(500).json({ success: false, message: 'Error approving member' });
  }
};
