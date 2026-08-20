import { Router } from 'express';
import { createTemplate, listTemplates, updateTemplate, deleteTemplate } from '../controllers/templateController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createTemplate);
router.get('/', listTemplates);
router.put('/:templateId', updateTemplate);
router.delete('/:templateId', deleteTemplate);

export default router;
