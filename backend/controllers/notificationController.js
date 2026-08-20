import Notification from '../models/Notification.js';

export const listNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ account: req.accountId }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
      Notification.countDocuments({ account: req.accountId }),
      Notification.countDocuments({ account: req.accountId, isRead: false }),
    ]);

    res.json({ success: true, data: notifications, unreadCount, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) {
    console.error('List notifications error:', error);
    res.status(500).json({ success: false, message: 'Error listing notifications' });
  }
};

export const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, account: req.accountId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Error marking notification' });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ account: req.accountId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ success: false, message: 'Error marking notifications' });
  }
};
