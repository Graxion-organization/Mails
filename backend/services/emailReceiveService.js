import { nanoid } from 'nanoid';
import Message from '../models/Message.js';
import Thread from '../models/Thread.js';
import Mailbox from '../models/Mailbox.js';
import Filter from '../models/Filter.js';
import Notification from '../models/Notification.js';
import { analyzeSpam } from './spamService.js';

import getResend from '../config/resend.js';

// Escape string for RegExp
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

/**
 * Process an inbound email from Resend webhook
 */
export const processInboundEmail = async (payload) => {
  let {
    email_id,
    from: fromRaw,
    to: toRaw,
    cc: ccRaw,
    subject,
    html,
    text,
    headers = {},
    attachments: rawAttachments = [],
    message_id: payloadMessageId,
  } = payload;

  // Resend webhook 'email.received' only sends metadata. We must fetch the full body.
  if (email_id && !html && !text) {
    try {
      const resend = getResend();
      const { data: fullEmail, error } = await resend.emails.receiving.get(email_id);
      
      if (error) {
        console.error(`Resend API Error fetching email ${email_id}:`, error);
      } else if (fullEmail) {
        html = fullEmail.html;
        text = fullEmail.text;
        if (fullEmail.bcc) payload.bcc = fullEmail.bcc;
      }
    } catch (err) {
      console.error(`Failed to fetch full email for ${email_id}:`, err.message);
    }
  }

  // Parse addresses
  const from = parseAddress(fromRaw);
  const toAddresses = Array.isArray(toRaw) ? toRaw.map(parseAddress) : [parseAddress(toRaw)];
  const ccAddresses = ccRaw ? (Array.isArray(ccRaw) ? ccRaw.map(parseAddress) : [parseAddress(ccRaw)]) : [];

  // Find matching mailbox(es)
  const recipientEmails = toAddresses.map(a => a.email);
  const mailboxes = await Mailbox.find({
    address: { $in: recipientEmails },
    isActive: true,
  }).populate('organization');

  if (mailboxes.length === 0) {
    console.warn('📭 No matching mailbox for:', recipientEmails);
    return null;
  }

  const results = [];

  for (const mailbox of mailboxes) {
    const orgId = mailbox.organization._id || mailbox.organization;

    // Spam analysis
    const spamResult = analyzeSpam({
      from: from.email,
      subject,
      bodyText: text,
      bodyHtml: html,
      headers,
    });

    // Extract Message-ID and threading headers
    const messageId = payloadMessageId || headers['message-id'] || headers['Message-ID'] || `<${nanoid(24)}@inbound>`;
    const inReplyTo = headers['in-reply-to'] || headers['In-Reply-To'] || null;
    const referencesHeader = headers['references'] || headers['References'] || '';
    const references = referencesHeader ? referencesHeader.split(/\s+/).filter(Boolean) : [];

    // Find or create thread
    let thread = null;

    // Try to find existing thread by In-Reply-To or References
    if (inReplyTo) {
      const parentMessage = await Message.findOne({ messageId: inReplyTo, mailbox: mailbox._id });
      if (parentMessage) {
        thread = await Thread.findById(parentMessage.thread);
      }
    }

    if (!thread && references.length > 0) {
      const parentMessage = await Message.findOne({
        messageId: { $in: references },
        mailbox: mailbox._id,
      }).sort({ createdAt: -1 });
      if (parentMessage) {
        thread = await Thread.findById(parentMessage.thread);
      }
    }

    // Fallback to Subject matching if headers are stripped
    if (!thread && subject) {
      const cleanSubject = subject.replace(/^(Re|Fwd|Fw):\s*/i, '').trim();
      const parentThread = await Thread.findOne({
        mailbox: mailbox._id,
        subject: new RegExp(`^${escapeRegExp(cleanSubject)}$`, 'i')
      }).sort({ createdAt: -1 });
      if (parentThread) {
        thread = parentThread;
      }
    }

    // Create new thread if not found
    if (!thread) {
      thread = await Thread.create({
        organization: orgId,
        mailbox: mailbox._id,
        subject: subject || '(No Subject)',
        snippet: (text || '').substring(0, 200),
        participants: [
          from,
          ...toAddresses,
          ...ccAddresses,
        ],
        messageCount: 1,
        lastMessageAt: new Date(),
        firstMessageAt: new Date(),
        folder: spamResult.isSpam ? 'spam' : 'inbox',
        category: categorizeEmail(from.email, subject, text),
        spamScore: spamResult.score,
        isSpam: spamResult.isSpam,
      });
    } else {
      // Update existing thread
      thread.messageCount += 1;
      thread.lastMessageAt = new Date();
      thread.snippet = (text || '').substring(0, 200);
      if (!spamResult.isSpam && thread.folder === 'archive') {
        thread.folder = 'inbox'; // Move back to inbox on new reply
      }
      
      // Add new participants
      const existingEmails = new Set(thread.participants.map(p => p.email));
      if (!existingEmails.has(from.email)) {
        thread.participants.push(from);
      }
      await thread.save();
    }

    // Create message record
    const message = await Message.create({
      thread: thread._id,
      organization: orgId,
      mailbox: mailbox._id,
      messageId,
      inReplyTo,
      references,
      from,
      to: toAddresses,
      cc: ccAddresses,
      subject: subject || '(No Subject)',
      bodyHtml: html || '',
      bodyText: text || '',
      snippet: (text || '').substring(0, 200),
      attachments: [], // Will be processed separately for R2 upload
      direction: 'inbound',
      status: 'delivered',
      spamAnalysis: spamResult,
    });

    // Update mailbox counts
    await Mailbox.findByIdAndUpdate(mailbox._id, {
      $inc: { totalCount: 1, unreadCount: 1 },
    });

    // Apply filters
    await applyFilters(message, thread, orgId);

    // Send notification to mailbox members
    if (!spamResult.isSpam) {
      for (const member of mailbox.members) {
        await Notification.create({
          account: member.account,
          organization: orgId,
          type: 'new_email',
          title: `New email from ${from.name || from.email}`,
          body: subject || '(No Subject)',
          link: `/mail/thread/${thread._id}`,
          metadata: {
            threadId: thread._id,
            messageId: message._id,
            from: from.email,
          },
        });
      }
    }

    // Handle auto-reply
    if (mailbox.autoReply?.enabled) {
      const now = new Date();
      const start = mailbox.autoReply.startDate ? new Date(mailbox.autoReply.startDate) : null;
      const end = mailbox.autoReply.endDate ? new Date(mailbox.autoReply.endDate) : null;
      
      if ((!start || now >= start) && (!end || now <= end)) {
        // Queue auto-reply (would use BullMQ in production)
        console.log(`📤 Auto-reply queued for ${from.email}`);
      }
    }

    results.push({ message, thread });
  }

  return results;
};

/**
 * Parse email address string into { email, name }
 */
function parseAddress(raw) {
  if (typeof raw === 'object' && raw.email) return raw;
  if (typeof raw !== 'string') return { email: '', name: '' };
  
  const match = raw.match(/^(.+?)\s*<(.+?)>$/);
  if (match) {
    return { name: match[1].trim().replace(/^"|"$/g, ''), email: match[2].toLowerCase().trim() };
  }
  return { email: raw.toLowerCase().trim(), name: '' };
}

/**
 * Auto-categorize email (basic heuristic)
 */
function categorizeEmail(fromEmail, subject = '', body = '') {
  const text = `${fromEmail} ${subject} ${body}`.toLowerCase();
  
  if (/newsletter|unsubscribe|digest|weekly|daily/.test(text)) return 'updates';
  if (/linkedin|facebook|twitter|instagram|social/.test(text)) return 'social';
  if (/sale|discount|deal|offer|promo|coupon|off|shop/.test(text)) return 'promotions';
  if (/forum|community|discussion|thread|reply/.test(text)) return 'forums';
  
  return 'primary';
}

/**
 * Apply user-defined filters to incoming message
 */
async function applyFilters(message, thread, orgId) {
  const filters = await Filter.find({
    organization: orgId,
    isActive: true,
  }).sort({ priority: 1 });

  for (const filter of filters) {
    const { conditions, actions } = filter;
    let matches = true;

    // Check conditions
    if (conditions.from && !message.from.email.includes(conditions.from.toLowerCase())) matches = false;
    if (conditions.to && !message.to.some(t => t.email.includes(conditions.to.toLowerCase()))) matches = false;
    if (conditions.subject && !message.subject.toLowerCase().includes(conditions.subject.toLowerCase())) matches = false;
    if (conditions.body && !message.bodyText.toLowerCase().includes(conditions.body.toLowerCase())) matches = false;
    if (conditions.hasAttachment === true && message.attachments.length === 0) matches = false;
    if (conditions.hasAttachment === false && message.attachments.length > 0) matches = false;

    if (!matches) continue;

    // Apply actions
    if (actions.addLabel) {
      if (!thread.labels.includes(actions.addLabel)) {
        thread.labels.push(actions.addLabel);
      }
    }
    if (actions.removeLabel) {
      thread.labels = thread.labels.filter(l => l.toString() !== actions.removeLabel.toString());
    }
    if (actions.markAsRead) {
      // Mark as read for the filter owner
    }
    if (actions.archive) {
      thread.folder = 'archive';
    }
    if (actions.moveToFolder) {
      thread.folder = actions.moveToFolder;
    }
    if (actions.category) {
      thread.category = actions.category;
    }

    // Update filter stats
    filter.matchCount += 1;
    filter.lastMatchAt = new Date();
    await filter.save();
  }

  await thread.save();
}

export default { processInboundEmail };
