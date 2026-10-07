const { prisma } = require('../config/db');

// GET /api/notifications — Authenticated (fetch logged-in user's notifications)
const getMyNotifications = async (req, res) => {
  const { id: userId, role } = req.user;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        recipientRole: role,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error('getMyNotifications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

// GET /api/notifications/:id — Authenticated (fetch single notification with ownership check)
const getNotificationById = async (req, res) => {
  const { id: userId, role } = req.user;
  const targetId = Number(req.params.id);

  if (isNaN(targetId)) {
    return res.status(400).json({ success: false, message: 'Invalid notification ID' });
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: targetId },
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipientId !== userId || notification.recipientRole !== role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own notifications.',
      });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error('getNotificationById error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notification' });
  }
};

// PUT /api/notifications/:id/read — Authenticated (mark notification as read)
const markAsRead = async (req, res) => {
  const { id: userId, role } = req.user;
  const targetId = Number(req.params.id);

  if (isNaN(targetId)) {
    return res.status(400).json({ success: false, message: 'Invalid notification ID' });
  }

  try {
    const existingNotification = await prisma.notification.findUnique({
      where: { id: targetId },
    });

    if (!existingNotification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (existingNotification.recipientId !== userId || existingNotification.recipientRole !== role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify your own notifications.',
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: targetId },
      data: { isRead: true },
    });

    res.status(200).json({ success: true, data: updatedNotification });
  } catch (error) {
    console.error('markAsRead error:', error);
    res.status(500).json({ success: false, message: 'Server error marking notification as read' });
  }
};

// DELETE /api/notifications/:id — Authenticated (delete notification)
const deleteNotification = async (req, res) => {
  const { id: userId, role } = req.user;
  const targetId = Number(req.params.id);

  if (isNaN(targetId)) {
    return res.status(400).json({ success: false, message: 'Invalid notification ID' });
  }

  try {
    const existingNotification = await prisma.notification.findUnique({
      where: { id: targetId },
    });

    if (!existingNotification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (existingNotification.recipientId !== userId || existingNotification.recipientRole !== role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own notifications.',
      });
    }

    await prisma.notification.delete({
      where: { id: targetId },
    });

    res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('deleteNotification error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting notification' });
  }
};

module.exports = {
  getMyNotifications,
  getNotificationById,
  markAsRead,
  deleteNotification,
};
