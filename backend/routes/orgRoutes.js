import { Router } from 'express';
import { createOrg, listOrgs, getOrg, updateOrg, deleteOrg } from '../controllers/orgController.js';
import { protect } from '../middleware/auth.js';
import { requireOrgMember, requireOrgRole } from '../middleware/rbac.js';

const router = Router();

router.use(protect);

router.post('/', createOrg);
router.get('/', listOrgs);
router.get('/:orgId', requireOrgMember, getOrg);
router.put('/:orgId', requireOrgMember, requireOrgRole('owner', 'admin'), updateOrg);
router.delete('/:orgId', requireOrgMember, requireOrgRole('owner'), deleteOrg);

export default router;
