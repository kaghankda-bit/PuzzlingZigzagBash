
const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    ticketNumber: {
        type: String,
        unique: true,
        required: true
    },
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    category: {
        type: String,
        enum: ['technical', 'billing', 'general', 'feature_request'],
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    responses: [{
        from: {
            type: String,
            enum: ['partner', 'admin'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        attachments: [String]
    }],
    attachments: [String],
    tags: [String],
    resolution: String,
    resolvedAt: Date,
    closedAt: Date
}, {
    timestamps: true
});

// Generate ticket number
supportTicketSchema.pre('save', function(next) {
    if (!this.ticketNumber) {
        this.ticketNumber = 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
