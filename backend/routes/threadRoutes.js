import { Router } from 'express';
import { listThreads, getThread, updateThread, moveThread, deleteThread, batchThreadAction } from '../controllers/threadController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', listThreads);
router.get('/:threadId', getThread);
router.put('/:threadId', updateThread);
router.put('/:threadId/move', moveThread);
router.delete('/:threadId', deleteThread);
router.post('/batch', batchThreadAction);

export default router;
