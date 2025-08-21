
const express = require('express');
const router = express.Router();
const { 
    createSupportTicket, 
    getUserTickets, 
    getAllTickets 
} = require('../controllers/tempSupportController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');

// @desc    Create a new support ticket
// @route   POST /api/support/tickets
// @access  Private
router.post('/tickets', protect, createSupportTicket);

// @desc    Get user's support tickets
// @route   GET /api/support/tickets
// @access  Private
router.get('/tickets', protect, getUserTickets);

// @desc    Get all support tickets (admin)
// @route   GET /api/support/admin/tickets
// @access  Private/Admin
router.get('/admin/tickets', protect, isAdmin, getAllTickets);

module.exports = router;
