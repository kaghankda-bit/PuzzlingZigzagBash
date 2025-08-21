const express = require('express');
const router = express.Router();
const {
    getNotificationSettings,
    updateNotificationSettings
} = require('../controllers/notificationController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// User notification settings routes
router.route('/settings')
    .get(protect, getNotificationSettings)
    .put(protect, updateNotificationSettings);

module.exports = router;
