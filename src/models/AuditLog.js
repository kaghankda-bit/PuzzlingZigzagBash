
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'BLOCK', 'UNBLOCK']
    },
    resource: {
        type: String,
        required: true,
        enum: ['USER', 'PARTNER', 'DEAL', 'REDEMPTION', 'DOCUMENT', 'NOTIFICATION']
    },
    resourceId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
