import { Router } from 'express';
import { getMe, setSession, logout } from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/set-session', setSession);
router.post('/logout', logout);

router.use(protect);
router.get('/me', getMe);

export default router;
