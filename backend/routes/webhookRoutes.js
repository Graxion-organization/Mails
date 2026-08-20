import { Router } from 'express';
import { processInboundEmail } from '../services/emailReceiveService.js';

const router = Router();

/**
 * Resend Inbound Webhook
 * POST /api/webhooks/resend/inbound
 */
router.post('/resend/inbound', async (req, res) => {
  try {
    // TODO: Verify webhook signature with RESEND_WEBHOOK_SECRET
    // Resend webhook payload might be wrapped in 'data' depending on webhook type
    const payload = req.body.type === 'email.received' ? req.body.data : req.body;
    
    console.log('📨 Inbound email webhook received for:', payload.to);
    
    const results = await processInboundEmail(payload);
    
    res.json({ success: true, processed: results?.length || 0 });
  } catch (error) {
    console.error('Inbound webhook error:', error);
    // Return 200 to prevent Resend from retrying
    res.status(200).json({ success: false, message: error.message });
  }
});

/**
 * Resend Event Webhook (delivery, bounce, complaint, etc.)
 * POST /api/webhooks/resend/events
 */
router.post('/resend/events', async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log(`📬 Resend event: ${type}`, data?.email_id);
    
    // Update message status based on event type
    // TODO: Implement event processing
    
    res.json({ success: true });
  } catch (error) {
    console.error('Event webhook error:', error);
    res.status(200).json({ success: false });
  }
});

export default router;
