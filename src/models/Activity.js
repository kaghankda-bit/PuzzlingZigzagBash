const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    deal: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Deal'
    },
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Merchant'
    },
    savings: {
        type: Number,
        required: true
    },
    redeemedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
