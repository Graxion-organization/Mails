import { Router } from 'express';
import multer from 'multer';
import { uploadAttachment, downloadAttachment, deleteAttachment } from '../controllers/attachmentController.js';
import { protect } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: parseInt(process.env.MAX_ATTACHMENT_SIZE || '26214400') }, // 25MB
});

const router = Router();
router.use(protect);

router.post('/upload', uploadLimiter, upload.single('file'), uploadAttachment);
router.get('/:attachmentId/download', downloadAttachment);
router.delete('/:attachmentId', deleteAttachment);

export default router;
