const express = require('express');
const router = express.Router();
const { inMemoryDB } = require('../inMemoryDB');
const { authMiddleware } = require('../middleware/auth');

// Get all notifications for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = Array.from(inMemoryDB.notifications.values())
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadCount,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'فشل في تحميل الإشعارات' });
  }
});

// Get unread notifications count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = Array.from(inMemoryDB.notifications.values())
      .filter(n => n.user_id === userId && !n.is_read).length;

    res.json({
      success: true,
      data: { unread_count: unreadCount }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'فشل في تحميل عدد الإشعارات' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = inMemoryDB.notifications.get(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    notification.is_read = true;
    notification.read_at = new Date().toISOString();
    inMemoryDB.notifications.set(notificationId, notification);

    res.json({
      success: true,
      message: 'تم وضع علامة مقروءة',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'فشل في تحديث الإشعار' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    let updatedCount = 0;

    inMemoryDB.notifications.forEach((notification, id) => {
      if (notification.user_id === userId && !notification.is_read) {
        notification.is_read = true;
        notification.read_at = new Date().toISOString();
        inMemoryDB.notifications.set(id, notification);
        updatedCount++;
      }
    });

    res.json({
      success: true,
      message: `تم وضع علامة مقروءة على ${updatedCount} إشعار`,
      data: { updated_count: updatedCount }
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'فشل في تحديث الإشعارات' });
  }
});

// Delete notification
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = inMemoryDB.notifications.get(notificationId);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    inMemoryDB.notifications.delete(notificationId);

    res.json({
      success: true,
      message: 'تم حذف الإشعار'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'فشل في حذف الإشعار' });
  }
});

// Delete all read notifications
router.delete('/read/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    let deletedCount = 0;

    const toDelete = [];
    inMemoryDB.notifications.forEach((notification, id) => {
      if (notification.user_id === userId && notification.is_read) {
        toDelete.push(id);
      }
    });

    toDelete.forEach(id => {
      inMemoryDB.notifications.delete(id);
      deletedCount++;
    });

    res.json({
      success: true,
      message: `تم حذف ${deletedCount} إشعار`,
      data: { deleted_count: deletedCount }
    });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ success: false, message: 'فشل في حذف الإشعارات' });
  }
});

// Create notification (internal use - for system to create notifications)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { user_id, type, title, message, priority, link } = req.body;

    // Only admins can create notifications
    if (req.user.role !== 'admin' && req.user.role !== 'department_head') {
      return res.status(403).json({ success: false, message: 'غير مصرح' });
    }

    const newNotification = {
      id: Math.max(...Array.from(inMemoryDB.notifications.keys()), 0) + 1,
      user_id,
      type: type || 'system',
      title,
      message,
      priority: priority || 'medium',
      link: link || null,
      is_read: false,
      read_at: null,
      created_at: new Date().toISOString()
    };

    inMemoryDB.notifications.set(newNotification.id, newNotification);

    res.json({
      success: true,
      message: 'تم إنشاء الإشعار',
      data: newNotification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, message: 'فشل في إنشاء الإشعار' });
  }
});

// Helper function to create notification (can be called from other routes)
function createNotification(user_id, type, title, message, priority = 'medium', link = null) {
  const newNotification = {
    id: Math.max(...Array.from(inMemoryDB.notifications.keys()), 0) + 1,
    user_id,
    type,
    title,
    message,
    priority,
    link,
    is_read: false,
    read_at: null,
    created_at: new Date().toISOString()
  };

  inMemoryDB.notifications.set(newNotification.id, newNotification);
  return newNotification;
}

module.exports = router;
module.exports.createNotification = createNotification;
