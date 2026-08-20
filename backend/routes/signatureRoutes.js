import { Router } from 'express';
import { createSignature, listSignatures, updateSignature, deleteSignature } from '../controllers/signatureController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createSignature);
router.get('/', listSignatures);
router.put('/:signatureId', updateSignature);
router.delete('/:signatureId', deleteSignature);

export default router;
