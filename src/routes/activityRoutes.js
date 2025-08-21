const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getActivityHistory, getSavingsSummary } = require('../controllers/activityController');

// @route   GET /api/activity/history
router.get('/history', protect, getActivityHistory);

// @route   GET /api/activity/savings
router.get('/savings', protect, getSavingsSummary);

module.exports = router;
