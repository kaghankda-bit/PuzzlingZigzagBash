const express = require('express');
const router = express.Router();
const { recordConsent, getConsentStatus, getConsentHistory } = require('../controllers/tempConsentController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// @desc    Record or update a user's consent
// @route   POST /api/consent
// @access  Private
router.post('/', protect, recordConsent);

// @desc    Get the current consent status for a user
// @route   GET /api/consent/:type
// @access  Private
router.get('/:type', protect, getConsentStatus);

// @desc    Get the consent history for a user (for admin)
// @route   GET /api/consent/history/:userId
// @access  Private/Admin
router.get('/history/:userId', protect, isAdmin, getConsentHistory);

module.exports = router;
