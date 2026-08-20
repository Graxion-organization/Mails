import Draft from '../models/Draft.js';
import { sendEmail } from '../services/emailSendService.js';

/**
 * @desc    Create/save draft
 * @route   POST /api/mail/drafts
 */
export const createDraft = async (req, res) => {
  try {
    const { organizationId, mailboxId, to, cc, bcc, subject, bodyHtml, bodyText, threadId, inReplyTo, attachments, scheduledAt } = req.body;

    const draft = await Draft.create({
      account: req.accountId,
      organization: organizationId,
      mailbox: mailboxId,
      thread: threadId || null,
      inReplyTo,
      to, cc, bcc,
      subject, bodyHtml, bodyText,
      attachments: attachments || [],
      scheduledAt,
      lastSavedAt: new Date(),
    });

    res.status(201).json({ success: true, data: draft });
  } catch (error) {
    console.error('Create draft error:', error);
    res.status(500).json({ success: false, message: 'Error creating draft' });
  }
};

/**
 * @desc    List drafts
 * @route   GET /api/mail/drafts
 */
export const listDrafts = async (req, res) => {
  try {
    const { orgId } = req.query;
    const query = { account: req.accountId };
    if (orgId) query.organization = orgId;

    const drafts = await Draft.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, data: drafts });
  } catch (error) {
    console.error('List drafts error:', error);
    res.status(500).json({ success: false, message: 'Error listing drafts' });
  }
};

/**
 * @desc    Update draft (auto-save)
 * @route   PUT /api/mail/drafts/:draftId
 */
export const updateDraft = async (req, res) => {
  try {
    const { to, cc, bcc, subject, bodyHtml, bodyText, attachments, scheduledAt } = req.body;

    const draft = await Draft.findOneAndUpdate(
      { _id: req.params.draftId, account: req.accountId },
      {
        to, cc, bcc, subject, bodyHtml, bodyText,
        attachments, scheduledAt,
        lastSavedAt: new Date(),
        $inc: { saveCount: 1 },
      },
      { new: true }
    );

    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }

    res.json({ success: true, data: draft });
  } catch (error) {
    console.error('Update draft error:', error);
    res.status(500).json({ success: false, message: 'Error updating draft' });
  }
};

/**
 * @desc    Delete draft
 * @route   DELETE /api/mail/drafts/:draftId
 */
export const deleteDraft = async (req, res) => {
  try {
    await Draft.findOneAndDelete({ _id: req.params.draftId, account: req.accountId });
    res.json({ success: true, message: 'Draft discarded' });
  } catch (error) {
    console.error('Delete draft error:', error);
    res.status(500).json({ success: false, message: 'Error deleting draft' });
  }
};

/**
 * @desc    Send draft
 * @route   POST /api/mail/drafts/:draftId/send
 */
export const sendDraft = async (req, res) => {
  try {
    const draft = await Draft.findOne({ _id: req.params.draftId, account: req.accountId });
    if (!draft) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }

    const result = await sendEmail({
      organizationId: draft.organization,
      mailboxId: draft.mailbox,
      accountId: req.accountId,
      to: draft.to,
      cc: draft.cc,
      bcc: draft.bcc,
      subject: draft.subject,
      bodyHtml: draft.bodyHtml,
      bodyText: draft.bodyText,
      attachments: draft.attachments,
      inReplyTo: draft.inReplyTo,
      threadId: draft.thread,
      scheduledAt: draft.scheduledAt,
    });

    // Delete draft after sending
    await Draft.findByIdAndDelete(draft._id);

    res.status(201).json({ success: true, message: 'Draft sent', data: result });
  } catch (error) {
    console.error('Send draft error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error sending draft' });
  }
};
