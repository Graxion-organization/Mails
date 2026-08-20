import Thread from '../models/Thread.js';
import Message from '../models/Message.js';

/**
 * Advanced search across threads and messages
 */
export const searchMail = async ({
  organizationId,
  accountId,
  query,
  from,
  to,
  subject,
  hasAttachment,
  label,
  category,
  folder,
  dateFrom,
  dateTo,
  isRead,
  isStarred,
  page = 1,
  limit = 25,
}) => {
  const skip = (page - 1) * limit;

  // Build thread query
  const threadQuery = { organization: organizationId };

  // Text search
  if (query) {
    threadQuery.$text = { $search: query };
  }

  // Folder filter
  if (folder) {
    threadQuery.folder = folder;
  } else {
    threadQuery.folder = { $nin: ['spam', 'trash'] }; // Exclude by default
  }

  // Category filter
  if (category) {
    threadQuery.category = category;
  }

  // Label filter
  if (label) {
    threadQuery.labels = label;
  }

  // Date range
  if (dateFrom || dateTo) {
    threadQuery.lastMessageAt = {};
    if (dateFrom) threadQuery.lastMessageAt.$gte = new Date(dateFrom);
    if (dateTo) threadQuery.lastMessageAt.$lte = new Date(dateTo);
  }

  // User flags
  if (isRead !== undefined || isStarred !== undefined) {
    const flagQuery = { 'userFlags.account': accountId };
    if (isRead !== undefined) flagQuery['userFlags.isRead'] = isRead;
    if (isStarred !== undefined) flagQuery['userFlags.isStarred'] = isStarred;
    Object.assign(threadQuery, flagQuery);
  }

  // If searching by from/to/hasAttachment, we need to search messages first
  if (from || to || hasAttachment !== undefined || subject) {
    const messageQuery = { organization: organizationId };
    if (from) messageQuery['from.email'] = { $regex: from, $options: 'i' };
    if (to) messageQuery['to.email'] = { $regex: to, $options: 'i' };
    if (subject) messageQuery.subject = { $regex: subject, $options: 'i' };
    if (hasAttachment === true) messageQuery['attachments.0'] = { $exists: true };
    if (hasAttachment === false) messageQuery.attachments = { $size: 0 };

    const matchingMessages = await Message.find(messageQuery).distinct('thread');
    threadQuery._id = { $in: matchingMessages };
  }

  // Execute query
  const sortOptions = query
    ? { score: { $meta: 'textScore' }, lastMessageAt: -1 }
    : { lastMessageAt: -1 };

  const selectOptions = query
    ? { score: { $meta: 'textScore' } }
    : {};

  const [threads, total] = await Promise.all([
    Thread.find(threadQuery, selectOptions)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('labels')
      .lean(),
    Thread.countDocuments(threadQuery),
  ]);

  return {
    threads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + threads.length < total,
    },
  };
};

export default { searchMail };
