import { Router } from 'express';
import { search } from '../controllers/searchController.js';
import { protect } from '../middleware/auth.js';
import { searchLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(protect);

router.get('/', searchLimiter, search);

export default router;
