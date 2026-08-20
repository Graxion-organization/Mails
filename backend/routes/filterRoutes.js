import { Router } from 'express';
import { createFilter, listFilters, updateFilter, deleteFilter } from '../controllers/filterController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createFilter);
router.get('/', listFilters);
router.put('/:filterId', updateFilter);
router.delete('/:filterId', deleteFilter);

export default router;
