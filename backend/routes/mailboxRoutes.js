import { Router } from 'express';
import { createMailbox, listMailboxes, updateMailbox, deleteMailbox } from '../controllers/mailboxController.js';
import { protect } from '../middleware/auth.js';
import { requireOrgMember, requirePermission } from '../middleware/rbac.js';

const router = Router({ mergeParams: true });

router.use(protect, requireOrgMember);

router.post('/', requirePermission('mailbox.create'), createMailbox);
router.get('/', listMailboxes);
router.put('/:mailboxId', requirePermission('mailbox.update'), updateMailbox);
router.delete('/:mailboxId', requirePermission('mailbox.delete'), deleteMailbox);

export default router;
