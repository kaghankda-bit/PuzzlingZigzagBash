
const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner'
    },
    type: {
        type: String,
        enum: ['marketing', 'analytics', 'data_processing', 'cookies', 'third_party_sharing'],
        required: true
    },
    granted: {
        type: Boolean,
        required: true
    },
    grantedAt: {
        type: Date
    },
    revokedAt: {
        type: Date
    },
    ipAddress: String,
    userAgent: String,
    source: {
        type: String,
        enum: ['app', 'web', 'admin'],
        required: true
    },
    version: {
        type: String,
        default: '1.0'
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Index for efficient querying
consentSchema.index({ user: 1, type: 1 });
consentSchema.index({ partner: 1, type: 1 });
consentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Consent', consentSchema);
