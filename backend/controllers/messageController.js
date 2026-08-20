import { sendEmail, undoSend } from '../services/emailSendService.js';
import Message from '../models/Message.js';
import Thread from '../models/Thread.js';

/**
 * @desc    Send a new email
 * @route   POST /api/mail/send
 */
export const composeSend = async (req, res) => {
  try {
    const { organizationId, mailboxId, to, cc, bcc, subject, bodyHtml, bodyText, attachments, signatureHtml } = req.body;

    if (!organizationId || !mailboxId || !to || to.length === 0) {
      return res.status(400).json({ success: false, message: 'Organization, mailbox, and recipients are required' });
    }

    const result = await sendEmail({
      organizationId,
      mailboxId,
      accountId: req.accountId,
      to,
      cc,
      bcc,
      subject,
      bodyHtml,
      bodyText,
      attachments,
      signatureHtml,
    });

    res.status(201).json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error sending email' });
  }
};

/**
 * @desc    Reply to a message
 * @route   POST /api/mail/reply
 */
export const replyToMessage = async (req, res) => {
  try {
    const { messageId, organizationId, mailboxId, to, cc, bcc, bodyHtml, bodyText, replyAll, signatureHtml } = req.body;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ success: false, message: 'Original message not found' });
    }

    // Determine recipients
    let replyTo = to;
    if (!replyTo || replyTo.length === 0) {
      replyTo = [{ email: originalMessage.from.email, name: originalMessage.from.name }];
    }

    let replyCc = cc || [];
    if (replyAll && (!cc || cc.length === 0)) {
      replyCc = [
        ...originalMessage.to.filter(r => r.email !== originalMessage.from.email),
        ...(originalMessage.cc || []),
      ];
    }

    const result = await sendEmail({
      organizationId,
      mailboxId,
      accountId: req.accountId,
      to: replyTo,
      cc: replyCc,
      bcc,
      subject: originalMessage.subject.startsWith('Re:') ? originalMessage.subject : `Re: ${originalMessage.subject}`,
      bodyHtml,
      bodyText,
      inReplyTo: originalMessage.messageId,
      threadId: originalMessage.thread,
      signatureHtml,
    });

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Reply error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error sending reply' });
  }
};

/**
 * @desc    Forward a message
 * @route   POST /api/mail/forward
 */
export const forwardMessage = async (req, res) => {
  try {
    const { messageId, organizationId, mailboxId, to, cc, bcc, bodyHtml, bodyText, signatureHtml } = req.body;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ success: false, message: 'Original message not found' });
    }

    // Build forwarded content
    const forwardHeader = `
      <br/><br/>
      <div style="border-left: 2px solid #8b5cf6; padding-left: 12px; margin-left: 0; color: #a1a1aa;">
        <p><strong>---------- Forwarded message ----------</strong></p>
        <p>From: ${originalMessage.from.name} &lt;${originalMessage.from.email}&gt;</p>
        <p>Date: ${new Date(originalMessage.createdAt).toLocaleString()}</p>
        <p>Subject: ${originalMessage.subject}</p>
        <p>To: ${originalMessage.to.map(t => t.email).join(', ')}</p>
      </div>
      <br/>
      ${originalMessage.bodyHtml}
    `;

    const result = await sendEmail({
      organizationId,
      mailboxId,
      accountId: req.accountId,
      to,
      cc,
      bcc,
      subject: originalMessage.subject.startsWith('Fwd:') ? originalMessage.subject : `Fwd: ${originalMessage.subject}`,
      bodyHtml: (bodyHtml || '') + forwardHeader,
      bodyText: bodyText || '',
      attachments: originalMessage.attachments, // Forward attachments
      signatureHtml,
    });

    res.status(201).json({
      success: true,
      message: 'Message forwarded successfully',
      data: result,
    });
  } catch (error) {
    console.error('Forward error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error forwarding message' });
  }
};

/**
 * @desc    Schedule an email
 * @route   POST /api/mail/schedule
 */
export const scheduleEmail = async (req, res) => {
  try {
    const { organizationId, mailboxId, to, cc, bcc, subject, bodyHtml, bodyText, scheduledAt, signatureHtml } = req.body;

    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: 'scheduledAt is required' });
    }

    const result = await sendEmail({
      organizationId,
      mailboxId,
      accountId: req.accountId,
      to, cc, bcc, subject, bodyHtml, bodyText,
      scheduledAt,
      signatureHtml,
    });

    res.status(201).json({
      success: true,
      message: 'Email scheduled',
      data: result,
    });
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error scheduling email' });
  }
};

/**
 * @desc    Undo send (within 30s window)
 * @route   POST /api/mail/undo-send
 */
export const undoSendMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    const message = await undoSend(messageId, req.accountId);

    res.json({ success: true, message: 'Email send cancelled', data: message });
  } catch (error) {
    console.error('Undo send error:', error);
    res.status(400).json({ success: false, message: error.message || 'Cannot undo send' });
  }
};

/**
 * @desc    Get single message
 * @route   GET /api/mail/messages/:messageId
 */
export const getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ success: false, message: 'Error fetching message' });
  }
};
