const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        enum: ['Standard', 'VIP'] 
    },
    price: { 
        type: Number, 
        required: true 
    },
    currency: { 
        type: String, 
        required: true, 
        default: 'eur' 
    },
    interval: { 
        type: String, 
        required: true, 
        enum: ['month', 'year'] 
    },
    features: { 
        type: [String], 
        required: true 
    },
    stripePriceId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    isPopular: { 
        type: Boolean, 
        default: false 
    }
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;
