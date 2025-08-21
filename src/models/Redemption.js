const mongoose = require('mongoose');

const redemptionSchema = new mongoose.Schema({
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
    redeemedAt: {
        type: Date,
        default: Date.now
    },
    savings: {
        type: Number,
        required: true,
        default: 0
    },
    userReportedSavings: {
        type: Number
    }
});

// To ensure a user can redeem a specific deal only once
redemptionSchema.index({ user: 1, deal: 1 }, { unique: true });

const Redemption = mongoose.model('Redemption', redemptionSchema);

module.exports = Redemption;
