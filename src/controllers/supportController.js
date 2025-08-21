
const SupportTicket = require('../models/SupportTicket');
const Partner = require('../models/Partner');
const AuditLog = require('../models/AuditLog');

const createTicket = async (req, res) => {
    try {
        const { subject, description, category, priority } = req.body;
        
        const ticket = new SupportTicket({
            partner: req.user.partnerId || req.user._id,
            subject,
            description,
            category,
            priority: priority || 'medium'
        });

        await ticket.save();

        await AuditLog.create({
            action: 'SUPPORT_TICKET_CREATED',
            userId: req.user._id,
            targetId: ticket._id,
            details: { ticketNumber: ticket.ticketNumber, category }
        });

        res.status(201).json({
            message: 'Support ticket created successfully',
            ticket
        });

    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ message: 'Failed to create support ticket' });
    }
};

const getTickets = async (req, res) => {
    try {
        const { status, category, priority, page = 1, limit = 10 } = req.query;
        
        const filter = {};
        if (req.user.role !== 'admin') {
            filter.partner = req.user.partnerId || req.user._id;
        }
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;

        const tickets = await SupportTicket.find(filter)
            .populate('partner', 'businessName email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await SupportTicket.countDocuments(filter);

        res.json({
            tickets,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ message: 'Failed to retrieve tickets' });
    }
};

const updateTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status, priority, assignedTo, resolution } = req.body;

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Check permissions
        if (req.user.role !== 'admin' && ticket.partner.toString() !== req.user.partnerId?.toString() && ticket.partner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const updates = {};
        if (status) {
            updates.status = status;
            if (status === 'resolved') {
                updates.resolvedAt = new Date();
                updates.resolution = resolution;
            } else if (status === 'closed') {
                updates.closedAt = new Date();
            }
        }
        if (priority) updates.priority = priority;
        if (assignedTo) updates.assignedTo = assignedTo;

        const updatedTicket = await SupportTicket.findByIdAndUpdate(
            ticketId,
            updates,
            { new: true }
        ).populate('partner', 'businessName email')
         .populate('assignedTo', 'name email');

        await AuditLog.create({
            action: 'SUPPORT_TICKET_UPDATED',
            userId: req.user._id,
            targetId: ticketId,
            details: updates
        });

        res.json({
            message: 'Ticket updated successfully',
            ticket: updatedTicket
        });

    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({ message: 'Failed to update ticket' });
    }
};

const addResponse = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message, attachments } = req.body;

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const response = {
            from: req.user.role === 'admin' ? 'admin' : 'partner',
            message,
            attachments: attachments || []
        };

        ticket.responses.push(response);
        
        // Update status if it was closed
        if (ticket.status === 'closed') {
            ticket.status = 'open';
        }

        await ticket.save();

        await AuditLog.create({
            action: 'SUPPORT_TICKET_RESPONSE_ADDED',
            userId: req.user._id,
            targetId: ticketId,
            details: { responseFrom: response.from }
        });

        res.json({
            message: 'Response added successfully',
            ticket
        });

    } catch (error) {
        console.error('Add response error:', error);
        res.status(500).json({ message: 'Failed to add response' });
    }
};

module.exports = {
    createTicket,
    getTickets,
    updateTicket,
    addResponse
};
