import { nanoid } from 'nanoid';
import getResend from '../config/resend.js';
import Message from '../models/Message.js';
import Thread from '../models/Thread.js';
import Mailbox from '../models/Mailbox.js';
import Contact from '../models/Contact.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Send an email via Resend and store in database
 */
export const sendEmail = async ({
  organizationId,
  mailboxId,
  accountId,
  to,
  cc = [],
  bcc = [],
  subject,
  bodyHtml,
  bodyText,
  attachments = [],
  inReplyTo = null,
  threadId = null,
  scheduledAt = null,
  signatureHtml = '',
}) => {
  const mailbox = await Mailbox.findById(mailboxId);
  if (!mailbox) throw new Error('Mailbox not found');

  // Generate Message-ID
  const domain = mailbox.address.split('@')[1];
  const messageId = `<${nanoid(24)}@${domain}>`;

  // Append signature
  const finalHtml = signatureHtml
    ? `${bodyHtml}<br/><div class="graxion-signature">${signatureHtml}</div>`
    : bodyHtml;

  // Build references chain for threading
  let references = [];
  if (inReplyTo) {
    const parentMsg = await Message.findOne({ messageId: inReplyTo });
    if (parentMsg) {
      references = [...(parentMsg.references || []), inReplyTo];
    }
  }

  // Prepare attachment URLs for Resend
  const resendAttachments = attachments.map(att => ({
    filename: att.filename,
    path: att.url, // Cloudinary URL
  }));

  // If scheduled for later, just create the message record
  if (scheduledAt && new Date(scheduledAt) > new Date()) {
    const message = await Message.create({
      organization: organizationId,
      mailbox: mailboxId,
      thread: threadId,
      messageId,
      inReplyTo,
      references,
      from: { email: mailbox.address, name: mailbox.displayName || mailbox.localPart },
      to: to.map(r => ({ email: r.email || r, name: r.name || '' })),
      cc: cc.map(r => ({ email: r.email || r, name: r.name || '' })),
      bcc: bcc.map(r => ({ email: r.email || r, name: r.name || '' })),
      subject: subject || '(No Subject)',
      bodyHtml: finalHtml,
      bodyText: bodyText || '',
      snippet: (bodyText || '').substring(0, 200),
      attachments,
      direction: 'outbound',
      status: 'scheduled',
      scheduledAt,
    });

    return { message, scheduled: true };
  }

  // Send via Resend
  const resend = getResend();
  const { data: resendData, error: resendError } = await resend.emails.send({
    from: `${mailbox.displayName || mailbox.localPart} <${mailbox.address}>`,
    to: to.map(r => r.email || r),
    cc: cc.map(r => r.email || r).filter(Boolean),
    bcc: bcc.map(r => r.email || r).filter(Boolean),
    subject: subject || '(No Subject)',
    html: finalHtml,
    text: bodyText || undefined,
    attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
    headers: {
      'Message-ID': messageId,
      ...(inReplyTo ? { 'In-Reply-To': inReplyTo } : {}),
      ...(references.length > 0 ? { 'References': references.join(' ') } : {}),
    },
  });

  if (resendError) {
    throw new Error(`Resend error: ${resendError.message}`);
  }

  // Find or create thread
  let thread;
  if (threadId) {
    thread = await Thread.findById(threadId);
  }

  if (!thread) {
    thread = await Thread.create({
      organization: organizationId,
      mailbox: mailboxId,
      subject: subject || '(No Subject)',
      snippet: (bodyText || '').substring(0, 200),
      participants: [
        { email: mailbox.address, name: mailbox.displayName || '' },
        ...to.map(r => ({ email: r.email || r, name: r.name || '' })),
      ],
      messageCount: 1,
      lastMessageAt: new Date(),
      firstMessageAt: new Date(),
      folder: 'sent',
      folders: ['sent'],
      category: 'primary',
    });
  } else {
    // Update existing thread
    thread.messageCount += 1;
    thread.lastMessageAt = new Date();
    thread.snippet = (bodyText || '').substring(0, 200);

    if (!thread.folders) thread.folders = [thread.folder || 'inbox'];
    if (!thread.folders.includes('sent')) {
      thread.folders.push('sent');
    }

    // Add new participants
    const existingEmails = new Set(thread.participants.map(p => p.email));
    for (const recipient of to) {
      const email = recipient.email || recipient;
      if (!existingEmails.has(email)) {
        thread.participants.push({ email, name: recipient.name || '' });
      }
    }

    // Auto-Labeling: Tag thread with the agent who replied
    const { default: Member } = await import('../models/Member.js');
    const { default: Label } = await import('../models/Label.js');

    const member = await Member.findOne({ organization: organizationId, account: accountId });
    if (member) {
      // Prefer invitedEmail for display if we don't have a name
      const displayName = member.invitedEmail || 'Agent';
      const labelName = `Replied by: ${displayName}`;

      let label = await Label.findOne({
        organization: organizationId,
        name: labelName,
      });

      if (!label) {
        label = await Label.create({
          organization: organizationId,
          name: labelName,
          color: '#8b5cf6', // Default distinct color
          type: 'system',
          scope: 'org'
        });
      }

      if (!thread.labels) thread.labels = [];
      if (!thread.labels.includes(label._id)) {
        thread.labels.push(label._id);
      }
    }

    await thread.save();
  }

  // Create message record
  const message = await Message.create({
    thread: thread._id,
    organization: organizationId,
    mailbox: mailboxId,
    messageId,
    inReplyTo,
    references,
    from: { email: mailbox.address, name: mailbox.displayName || mailbox.localPart },
    to: to.map(r => ({ email: r.email || r, name: r.name || '' })),
    cc: cc.map(r => ({ email: r.email || r, name: r.name || '' })),
    bcc: bcc.map(r => ({ email: r.email || r, name: r.name || '' })),
    subject: subject || '(No Subject)',
    bodyHtml: finalHtml,
    bodyText: bodyText || '',
    snippet: (bodyText || '').substring(0, 200),
    attachments,
    direction: 'outbound',
    status: 'sent',
    sentAt: new Date(),
    resendMessageId: resendData?.id,
    readBy: [{ account: accountId, readAt: new Date() }],
  });

  // Update mailbox counts
  await Mailbox.findByIdAndUpdate(mailboxId, { $inc: { totalCount: 1 } });

  // Auto-create contacts
  for (const recipient of [...to, ...cc]) {
    const email = recipient.email || recipient;
    const name = recipient.name || '';
    try {
      await Contact.findOneAndUpdate(
        { organization: organizationId, account: accountId, email },
        {
          $set: { name: name || undefined, lastEmailAt: new Date() },
          $inc: { emailCount: 1 },
          $setOnInsert: { source: 'auto' },
        },
        { upsert: true, new: true }
      );
    } catch {
      // Ignore duplicate errors
    }
  }

  // Audit log
  await AuditLog.create({
    organization: organizationId,
    account: accountId,
    action: 'message.sent',
    target: { type: 'message', id: message._id.toString() },
    metadata: { to: to.map(r => r.email || r), subject },
  });

  return { message, thread, resendId: resendData?.id };
};

/**
 * Cancel a scheduled email (if not yet sent)
 */
export const cancelScheduledEmail = async (messageId, accountId) => {
  const message = await Message.findById(messageId);
  if (!message) throw new Error('Message not found');
  if (message.status !== 'scheduled') throw new Error('Message is not scheduled');

  message.status = 'cancelled';
  await message.save();

  return message;
};

/**
 * Undo a recently sent email (within the undo window)
 */
export const undoSend = async (messageId, accountId) => {
  const undoWindow = parseInt(process.env.UNDO_SEND_WINDOW_SECONDS || '30') * 1000;
  const message = await Message.findById(messageId);

  if (!message) throw new Error('Message not found');
  if (message.status !== 'sent') throw new Error('Message cannot be unsent');

  const timeSinceSent = Date.now() - new Date(message.sentAt).getTime();
  if (timeSinceSent > undoWindow) {
    throw new Error('Undo window has expired');
  }

  // Note: Resend doesn't support recalling sent emails. 
  // The undo feature works by delaying the actual send via BullMQ
  // For now, we mark it as cancelled in our system
  message.status = 'cancelled';
  await message.save();

  return message;
};

export default { sendEmail, cancelScheduledEmail, undoSend };
