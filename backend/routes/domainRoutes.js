import { Router } from 'express';
import { addDomain, listDomains, verifyDomain, removeDomain } from '../controllers/domainController.js';
import { protect } from '../middleware/auth.js';
import { requireOrgMember, requireOrgRole } from '../middleware/rbac.js';

const router = Router({ mergeParams: true }); // mergeParams for :orgId

router.use(protect, requireOrgMember);

router.post('/', requireOrgRole('owner', 'admin'), addDomain);
router.get('/', listDomains);
router.post('/:domainId/verify', requireOrgRole('owner', 'admin'), verifyDomain);
router.delete('/:domainId', requireOrgRole('owner', 'admin'), removeDomain);

export default router;
