import Member from '../models/Member.js';

/**
 * Permission matrix: which roles can perform which actions
 */
const PERMISSIONS = {
  // Organization management
  'org.update':        ['owner', 'admin'],
  'org.delete':        ['owner'],
  'org.billing':       ['owner', 'admin', 'billing'],
  
  // Domain management
  'domain.add':        ['owner', 'admin'],
  'domain.remove':     ['owner', 'admin'],
  'domain.verify':     ['owner', 'admin'],
  
  // Mailbox management
  'mailbox.create':    ['owner', 'admin', 'manager'],
  'mailbox.update':    ['owner', 'admin', 'manager'],
  'mailbox.delete':    ['owner', 'admin'],
  
  // Member management
  'member.invite':     ['owner', 'admin', 'manager'],
  'member.remove':     ['owner', 'admin'],
  'member.role':       ['owner', 'admin'],
  
  // Email operations
  'mail.send':         ['owner', 'admin', 'manager', 'support_agent', 'member'],
  'mail.read':         ['owner', 'admin', 'manager', 'support_agent', 'member'],
  'mail.delete':       ['owner', 'admin', 'manager', 'support_agent'],
  
  // Settings
  'settings.view':     ['owner', 'admin', 'manager'],
  'settings.update':   ['owner', 'admin'],
  
  // Labels & Filters
  'label.manage':      ['owner', 'admin', 'manager', 'support_agent', 'member'],
  'filter.manage':     ['owner', 'admin', 'manager', 'support_agent', 'member'],
  
  // Templates & Signatures
  'template.manage':   ['owner', 'admin', 'manager'],
  'signature.manage':  ['owner', 'admin', 'manager', 'support_agent', 'member'],
  
  // Audit logs
  'audit.view':        ['owner', 'admin'],
};

/**
 * Middleware: Require user to be a member of the organization
 * Attaches req.member with role info
 */
export const requireOrgMember = async (req, res, next) => {
  try {
    const orgId = req.params.orgId || req.body.organizationId || req.query.orgId;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required',
      });
    }

    const member = await Member.findOne({
      organization: orgId,
      account: req.accountId,
      status: 'active',
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this organization',
      });
    }

    req.member = member;
    req.orgId = orgId;
    next();
  } catch (error) {
    console.error('RBAC error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
    });
  }
};

/**
 * Middleware factory: Require specific org roles
 * Usage: requireOrgRole('owner', 'admin')
 */
export const requireOrgRole = (...roles) => {
  return (req, res, next) => {
    if (!req.member) {
      return res.status(403).json({
        success: false,
        message: 'Organization membership required',
      });
    }

    if (!roles.includes(req.member.role)) {
      return res.status(403).json({
        success: false,
        message: `This action requires one of these roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Middleware factory: Require specific permission
 * Usage: requirePermission('mailbox.create')
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.member) {
      return res.status(403).json({
        success: false,
        message: 'Organization membership required',
      });
    }

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) {
      console.error(`Unknown permission: ${permission}`);
      return res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
    }

    if (!allowedRoles.includes(req.member.role)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission to perform this action (${permission})`,
      });
    }

    next();
  };
};

/**
 * Middleware: Require access to a specific mailbox
 */
export const requireMailboxAccess = async (req, res, next) => {
  try {
    const mailboxId = req.params.mailboxId || req.body.mailboxId;
    
    if (!mailboxId) {
      return next(); // No mailbox specified, skip check
    }

    // Owners and admins have access to all mailboxes
    if (['owner', 'admin'].includes(req.member?.role)) {
      return next();
    }

    // Check if the member has mailbox-level access
    if (req.member?.mailboxAccess?.length > 0) {
      const hasAccess = req.member.mailboxAccess.some(
        (ma) => ma.mailbox.toString() === mailboxId
      );
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this mailbox',
        });
      }
    }

    next();
  } catch (error) {
    console.error('Mailbox access error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error',
    });
  }
};

export default { requireOrgMember, requireOrgRole, requirePermission, requireMailboxAccess };
