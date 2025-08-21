
const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { getAuditLogs, exportAuditLogs } = require('../controllers/auditController');

router.use(protect, adminOnly);

router.get('/', getAuditLogs);
router.get('/export', exportAuditLogs);

module.exports = router;
