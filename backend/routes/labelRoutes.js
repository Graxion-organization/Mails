import { Router } from 'express';
import { createLabel, listLabels, updateLabel, deleteLabel } from '../controllers/labelController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createLabel);
router.get('/', listLabels);
router.put('/:labelId', updateLabel);
router.delete('/:labelId', deleteLabel);

export default router;
