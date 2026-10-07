const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  getNotificationById,
  markAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticate);

// GET    /api/notifications
router.get('/', getMyNotifications);

// GET    /api/notifications/:id
router.get('/:id', getNotificationById);

// PUT    /api/notifications/:id/read
router.put('/:id/read', markAsRead);

// DELETE /api/notifications/:id
router.delete('/:id', deleteNotification);

module.exports = router;
