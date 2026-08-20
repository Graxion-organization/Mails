import Organization from '../models/Organization.js';
import Member from '../models/Member.js';
import AuditLog from '../models/AuditLog.js';

/**
 * @desc    Create a new organization
 * @route   POST /api/orgs
 */
export const createOrg = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Organization name is required' });
    }

    // Generate slug from name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await Organization.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const org = await Organization.create({
      name,
      slug,
      description,
      owner: req.accountId,
    });

    // Add owner as member
    await Member.create({
      organization: org._id,
      account: req.accountId,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    });

    await AuditLog.create({
      organization: org._id,
      account: req.accountId,
      action: 'org.created',
      target: { type: 'organization', id: org._id.toString() },
    });

    res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      data: org,
    });
  } catch (error) {
    console.error('Create org error:', error);
    res.status(500).json({ success: false, message: 'Error creating organization' });
  }
};

/**
 * @desc    List user's organizations
 * @route   GET /api/orgs
 */
export const listOrgs = async (req, res) => {
  try {
    const memberships = await Member.find({
      account: req.accountId,
      status: { $in: ['active', 'invited'] },
    }).select('organization role status');

    const orgIds = memberships.map(m => m.organization);
    const orgs = await Organization.find({
      _id: { $in: orgIds },
      status: { $ne: 'deleted' },
    }).lean();

    // Attach role info
    const orgsWithRole = orgs.map(org => {
      const membership = memberships.find(m => m.organization.toString() === org._id.toString());
      return { ...org, myRole: membership?.role, memberStatus: membership?.status };
    });

    res.json({ success: true, data: orgsWithRole });
  } catch (error) {
    console.error('List orgs error:', error);
    res.status(500).json({ success: false, message: 'Error listing organizations' });
  }
};

/**
 * @desc    Get organization details
 * @route   GET /api/orgs/:orgId
 */
export const getOrg = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.orgId);
    if (!org || org.status === 'deleted') {
      return res.status(404).json({ success: false, message: 'Organization not found' });
    }

    res.json({ success: true, data: org });
  } catch (error) {
    console.error('Get org error:', error);
    res.status(500).json({ success: false, message: 'Error fetching organization' });
  }
};

/**
 * @desc    Update organization
 * @route   PUT /api/orgs/:orgId
 */
export const updateOrg = async (req, res) => {
  try {
    const { name, description, logo, settings } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (logo !== undefined) updates.logo = logo;
    if (settings) updates.settings = { ...req.member?.organization?.settings, ...settings };

    const org = await Organization.findByIdAndUpdate(req.params.orgId, updates, { new: true });

    await AuditLog.create({
      organization: req.params.orgId,
      account: req.accountId,
      action: 'org.updated',
      target: { type: 'organization', id: req.params.orgId },
      metadata: { updates: Object.keys(updates) },
    });

    res.json({ success: true, data: org });
  } catch (error) {
    console.error('Update org error:', error);
    res.status(500).json({ success: false, message: 'Error updating organization' });
  }
};

/**
 * @desc    Delete organization (soft)
 * @route   DELETE /api/orgs/:orgId
 */
export const deleteOrg = async (req, res) => {
  try {
    await Organization.findByIdAndUpdate(req.params.orgId, {
      status: 'deleted',
      deletedAt: new Date(),
    });

    res.json({ success: true, message: 'Organization deleted' });
  } catch (error) {
    console.error('Delete org error:', error);
    res.status(500).json({ success: false, message: 'Error deleting organization' });
  }
};
