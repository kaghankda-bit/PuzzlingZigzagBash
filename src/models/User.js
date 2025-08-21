const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const shortid = require('shortid');

const userSchema = new mongoose.Schema({
    lastName: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
    },
    gender: {
        type: String,
    },
    birthdate: {
        type: Date,
    },
    profilePicture: {
        type: String,
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    favoriteMerchants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merchant'
    }],
    favoriteDeals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deal'
    }],
    savedLocations: [{
        name: { type: String, required: true },
        address: { type: String },
        location: {
            type: { type: String, enum: ['Point'], required: true },
            coordinates: { type: [Number], required: true } // [longitude, latitude]
        }
    }],

    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: false // Not required for social logins
    },
    role: {
        type: String,
        enum: ['Member', 'Partner', 'Admin'],
        default: 'Member'
    },
    googleId: { type: String },
    appleId: { type: String },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'apple'],
        default: 'local'
    },
    language: {
        type: String,
        enum: ['en', 'hr'],
        default: 'en'
    },

    fcmToken: String,
    membershipLevel: {
        type: String,
        enum: ['Standard', 'VIP'],
        default: 'Standard'
    },
    activationCode: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    referralCode: {
        type: String,
        unique: true,
        default: shortid.generate
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    referrals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    stripeCustomerId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    subscriptionStatus: {
        type: String,
        enum: ['none', 'active', 'canceled', 'past_due'],
        default: 'none'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    deactivatedAt: {
        type: Date
    },
    membershipId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values, but unique if not null
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.isNew) {
        this.referralCode = shortid.generate();
    }

    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;