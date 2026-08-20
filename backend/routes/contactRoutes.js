import { Router } from 'express';
import { createContact, listContacts, updateContact, deleteContact, autocomplete } from '../controllers/contactController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createContact);
router.get('/', listContacts);
router.get('/autocomplete', autocomplete);
router.put('/:contactId', updateContact);
router.delete('/:contactId', deleteContact);

export default router;
