import Notification from '../models/Notification.js';

// GET /api/notifications/
export const list = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ created_at: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Notifications list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/notifications/unread-count
export const unreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ is_read: false });
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/notifications/:id
export const markRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.is_read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/notifications/mark-all-read
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ is_read: false }, { is_read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
