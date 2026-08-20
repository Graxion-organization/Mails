import { Router } from 'express';
import { listNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', listNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

export default router;
