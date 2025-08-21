
const SupportTicket = require('../models/SupportTicket');

// @desc    Create a new support ticket
// @route   POST /api/support/tickets
// @access  Private
const createSupportTicket = async (req, res) => {
    try {
        const { subject, message, category, priority } = req.body;
        
        const ticket = await SupportTicket.create({
            user: req.user._id,
            subject,
            message,
            category: category || 'general',
            priority: priority || 'medium',
            status: 'open'
        });

        await ticket.populate('user', 'name email');

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create support ticket error:', error);
        res.status(500).json({ message: 'Failed to create support ticket' });
    }
};

// @desc    Get user's support tickets
// @route   GET /api/support/tickets
// @access  Private
const getUserTickets = async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        console.error('Get user tickets error:', error);
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

// @desc    Get all support tickets (admin)
// @route   GET /api/support/admin/tickets
// @access  Private/Admin
const getAllTickets = async (req, res) => {
    try {
        const { status, category, page = 1, limit = 20 } = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (category) filter.category = category;

        const skip = (page - 1) * limit;
        
        const tickets = await SupportTicket.find(filter)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await SupportTicket.countDocuments(filter);

        res.json({
            tickets,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
};

module.exports = {
    createSupportTicket,
    getUserTickets,
    getAllTickets
};
