const mongoose = require('mongoose');

const partnerSchema = new mongoose.Schema({
    usageType: {
        type: String,
        required: true,
        enum: ['provider', 'user', 'both']
    },
    oib: { type: String },
    companyLegalName: { type: String, required: true },
    representativeName: { type: String, required: true },
    representativeLastName: { type: String, required: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true 
    },
    phoneNumber: { type: String, required: true },
    businessLicense: { type: String }, // Path to the uploaded file
    ownerIdFront: { type: String },    // Path to the uploaded file
    ownerIdBack: { type: String },     // Path to the uploaded file
    referralCode: { type: String },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    userAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    stripeCustomerId: {
        type: String,
        unique: true,
        sparse: true
    },
    subscriptionId: {
        type: String,
        unique: true,
        sparse: true
    },
    subscriptionStatus: {
        type: String,
        enum: ['none', 'active', 'canceled', 'past_due'],
        default: 'none'
    }
}, { timestamps: true });

const Partner = mongoose.model('Partner', partnerSchema);

module.exports = Partner;
