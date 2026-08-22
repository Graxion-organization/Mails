import { Router } from 'express';
import { getLabels, createLabel, updateLabel, deleteLabel, toggleThreadLabel } from '../controllers/labelController.js';
import { protect } from '../middleware/auth.js';

const router = Router({ mergeParams: true });
router.use(protect);

router.get('/', getLabels);
router.post('/', createLabel);
router.put('/:labelId', updateLabel);
router.delete('/:labelId', deleteLabel);

// Assign/remove label to/from thread
router.post('/thread/:threadId', toggleThreadLabel);

export default router;
