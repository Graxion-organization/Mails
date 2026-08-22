import { Router } from 'express';
import { getMe } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/me', getMe);

export default router;
