import Thread from '../models/Thread.js';
import Message from '../models/Message.js';
import Mailbox from '../models/Mailbox.js';

/**
 * @desc    List threads (with folder, filters, pagination)
 * @route   GET /api/mail/threads
 */
export const listThreads = async (req, res) => {
  try {
    const {
      orgId, mailboxId, folder = 'inbox', category,
      page = 1, limit = 50, starred, important,
    } = req.query;

    if (!orgId) {
      return res.status(400).json({ success: false, message: 'orgId is required' });
    }

    const query = { organization: orgId };
    if (folder) {
      query.$or = [
        { folder: folder },
        { folders: folder }
      ];
    }

    if (mailboxId) query.mailbox = mailboxId;
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [threads, total] = await Promise.all([
      Thread.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('labels', 'name color')
        .lean(),
      Thread.countDocuments(query),
    ]);

    // Attach user-specific flags
    const threadsWithFlags = threads.map(thread => {
      const userFlag = thread.userFlags?.find(f => f.account === req.accountId) || {};
      return {
        ...thread,
        isRead: userFlag.isRead || false,
        isStarred: userFlag.isStarred || false,
        isImportant: userFlag.isImportant || false,
      };
    });

    res.json({
      success: true,
      data: threadsWithFlags,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('List threads error:', error);
    res.status(500).json({ success: false, message: 'Error listing threads' });
  }
};

/**
 * @desc    Get thread with all messages
 * @route   GET /api/mail/threads/:threadId
 */
export const getThread = async (req, res) => {
  try {
    const thread = await Thread.findById(req.params.threadId)
      .populate('labels', 'name color');

    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    const messages = await Message.find({
      thread: thread._id,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    // Mark as read for this user
    const flagIndex = thread.userFlags.findIndex(f => f.account === req.accountId);
    if (flagIndex >= 0) {
      thread.userFlags[flagIndex].isRead = true;
    } else {
      thread.userFlags.push({ account: req.accountId, isRead: true });
    }
    await thread.save();

    // Mark messages as read
    await Message.updateMany(
      {
        thread: thread._id,
        'readBy.account': { $ne: req.accountId },
      },
      {
        $push: { readBy: { account: req.accountId, readAt: new Date() } },
      }
    );

    res.json({
      success: true,
      data: { thread, messages },
    });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ success: false, message: 'Error fetching thread' });
  }
};

/**
 * @desc    Update thread (labels, star, read, important)
 * @route   PUT /api/mail/threads/:threadId
 */
export const updateThread = async (req, res) => {
  try {
    const { labels, isStarred, isRead, isImportant, status, priority, assignedTo, tags } = req.body;

    const thread = await Thread.findById(req.params.threadId);
    if (!thread) {
      return res.status(404).json({ success: false, message: 'Thread not found' });
    }

    // Update labels
    if (labels !== undefined) thread.labels = labels;
    if (status) thread.status = status;
    if (priority) thread.priority = priority;
    if (assignedTo !== undefined) thread.assignedTo = assignedTo;
    if (tags) thread.tags = tags;

    // Update user-specific flags
    if (isStarred !== undefined || isRead !== undefined || isImportant !== undefined) {
      const flagIndex = thread.userFlags.findIndex(f => f.account === req.accountId);
      const flags = flagIndex >= 0 ? thread.userFlags[flagIndex] : { account: req.accountId };

      if (isStarred !== undefined) flags.isStarred = isStarred;
      if (isRead !== undefined) flags.isRead = isRead;
      if (isImportant !== undefined) flags.isImportant = isImportant;

      if (flagIndex >= 0) {
        thread.userFlags[flagIndex] = flags;
      } else {
        thread.userFlags.push(flags);
      }
    }

    await thread.save();

    res.json({ success: true, data: thread });
  } catch (error) {
    console.error('Update thread error:', error);
    res.status(500).json({ success: false, message: 'Error updating thread' });
  }
};

/**
 * @desc    Move thread to folder
 * @route   PUT /api/mail/threads/:threadId/move
 */
export const moveThread = async (req, res) => {
  try {
    const { folder } = req.body;
    const validFolders = ['inbox', 'archive', 'spam', 'trash'];

    if (!validFolders.includes(folder)) {
      return res.status(400).json({ success: false, message: 'Invalid folder' });
    }

    const update = { folder, folders: [folder] };
    if (folder === 'trash') update.trashedAt = new Date();
    if (folder === 'inbox') update.trashedAt = null;

    const thread = await Thread.findByIdAndUpdate(req.params.threadId, update, { new: true });

    res.json({ success: true, data: thread });
  } catch (error) {
    console.error('Move thread error:', error);
    res.status(500).json({ success: false, message: 'Error moving thread' });
  }
};

/**
 * @desc    Permanently delete thread
 * @route   DELETE /api/mail/threads/:threadId
 */
export const deleteThread = async (req, res) => {
  try {
    await Message.updateMany({ thread: req.params.threadId }, { isDeleted: true, deletedAt: new Date() });
    await Thread.findByIdAndUpdate(req.params.threadId, { deletedAt: new Date(), folder: 'trash' });

    res.json({ success: true, message: 'Thread deleted' });
  } catch (error) {
    console.error('Delete thread error:', error);
    res.status(500).json({ success: false, message: 'Error deleting thread' });
  }
};

/**
 * @desc    Batch thread actions
 * @route   POST /api/mail/threads/batch
 */
export const batchThreadAction = async (req, res) => {
  try {
    const { threadIds, action, value } = req.body;

    if (!threadIds || !Array.isArray(threadIds) || threadIds.length === 0) {
      return res.status(400).json({ success: false, message: 'threadIds array is required' });
    }

    let updateQuery = {};

    switch (action) {
      case 'archive':
        updateQuery = { folder: 'archive', folders: ['archive'] };
        break;
      case 'trash':
        updateQuery = { folder: 'trash', folders: ['trash'], trashedAt: new Date() };
        break;
      case 'spam':
        updateQuery = { folder: 'spam', folders: ['spam'] };
        break;
      case 'inbox':
        updateQuery = { folder: 'inbox', folders: ['inbox'], trashedAt: null };
        break;
      case 'markRead':
      case 'markUnread':
        // Handle per-user flags
        const threads = await Thread.find({ _id: { $in: threadIds } });
        for (const thread of threads) {
          const flagIndex = thread.userFlags.findIndex(f => f.account === req.accountId);
          const flags = flagIndex >= 0 ? thread.userFlags[flagIndex] : { account: req.accountId };
          flags.isRead = action === 'markRead';
          if (flagIndex >= 0) {
            thread.userFlags[flagIndex] = flags;
          } else {
            thread.userFlags.push(flags);
          }
          await thread.save();
        }
        return res.json({ success: true, message: `${threads.length} threads updated` });
      default:
        return res.status(400).json({ success: false, message: 'Invalid batch action' });
    }

    const result = await Thread.updateMany({ _id: { $in: threadIds } }, updateQuery);

    res.json({ success: true, message: `${result.modifiedCount} threads updated` });
  } catch (error) {
    console.error('Batch action error:', error);
    res.status(500).json({ success: false, message: 'Error performing batch action' });
  }
};
