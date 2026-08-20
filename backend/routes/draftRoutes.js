import { Router } from 'express';
import { createDraft, listDrafts, updateDraft, deleteDraft, sendDraft } from '../controllers/draftController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createDraft);
router.get('/', listDrafts);
router.put('/:draftId', updateDraft);
router.delete('/:draftId', deleteDraft);
router.post('/:draftId/send', sendDraft);

export default router;
