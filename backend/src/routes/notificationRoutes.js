const express = require('express');
const router = express.Router();
const {
  getAllNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');
const { authentifier } = require('../middleware/auth');

router.use(authentifier);

router.get('/', getAllNotifications);
router.post('/', createNotification);
router.patch('/:id/read', markAsRead);
router.patch('/read/all', markAllAsRead);

module.exports = router;