import { Router } from 'express';
import { inviteMember, listMembers, changeMemberRole, removeMember, approveMember, toggleMemberStatus, updateMemberMailboxes } from '../controllers/memberController.js';
import { protect } from '../middleware/auth.js';
import { requireOrgMember, requirePermission } from '../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.use(protect, requireOrgMember);

router.post('/invite', requirePermission('member.invite'), inviteMember);
router.get('/', listMembers);
router.put('/:memberId/role', requirePermission('member.role'), changeMemberRole);
router.put('/:memberId/status', requirePermission('member.role'), toggleMemberStatus);
router.put('/:memberId/mailboxes', requirePermission('member.role'), updateMemberMailboxes);
router.post('/:memberId/approve', requirePermission('member.role'), approveMember);
router.delete('/:memberId', requirePermission('member.remove'), removeMember);

export default router;
