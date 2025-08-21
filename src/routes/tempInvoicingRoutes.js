const express = require('express');
const router = express.Router();
const { generateEInvoice } = require('../controllers/tempInvoicingController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// @desc    Generate an e-Računi invoice
// @route   POST /api/invoicing/generate
// @access  Private/Admin
router.post('/generate', protect, isAdmin, generateEInvoice);

module.exports = router;
