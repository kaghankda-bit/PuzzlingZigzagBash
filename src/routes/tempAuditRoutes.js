const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/tempAuditController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// @desc    Get all audit logs with filtering
// @route   GET /api/audit
// @access  Private/Admin
router.get('/', protect, isAdmin, getAuditLogs);

module.exports = router;
