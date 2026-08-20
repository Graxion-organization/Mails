import { Router } from 'express';
import { composeSend, replyToMessage, forwardMessage, scheduleEmail, undoSendMessage, getMessage } from '../controllers/messageController.js';
import { addNote, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';
import { composeLimiter } from '../middleware/rateLimiter.js';

const router = Router();
router.use(protect);

router.post('/send', composeLimiter, composeSend);
router.post('/reply', composeLimiter, replyToMessage);
router.post('/forward', composeLimiter, forwardMessage);
router.post('/schedule', composeLimiter, scheduleEmail);
router.post('/undo-send', undoSendMessage);
router.get('/messages/:messageId', getMessage);

// Internal Notes
router.post('/messages/:messageId/notes', addNote);
router.delete('/messages/:messageId/notes/:noteId', deleteNote);

export default router;
