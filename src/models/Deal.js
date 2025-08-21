const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Partner'
    },
    merchant: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Merchant'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    dealCategory: {
        type: String,
        required: true
    },
    typeOfDiscount: {
        type: String,
        enum: ['Standard', 'Percentage', 'Buy1Get1'],
        required: true
    },
    discountValue: { // For percentage or fixed amount discounts
        type: Number
    },
    buyQuantity: { // For BOGO deals
        type: Number
    },
    getQuantity: { // For BOGO deals
        type: Number
    },
    campaignDuration: {
        startDate: { type: Date },
        endDate: { type: Date }
    },
    targetOutlets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant.locations'
    }],
    keywords: [String],
    targetAudience: {
        type: String,
        enum: ['All', 'Standard', 'VIP'],
        default: 'All'
    },
    termsAndConditions: {
        type: String
    },

    price: {
        type: Number,
        required: true
    },
    originalPrice: {
        type: Number
    },
    savings: {
        type: Number,
        required: true,
        default: 0
    },
    image: {
        type: String,
        required: true
    },
    validUntil: {
        type: Date
    },
    isSponsored: {
        type: Boolean,
        default: false
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'expired', 'pending_approval', 'rejected'],
        default: 'pending_approval'
    },
    rejectionReason: {
        type: String
    },
    ratings: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: String,
            enum: ['like', 'dislike'],
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

const Deal = mongoose.model('Deal', dealSchema);

module.exports = Deal;
