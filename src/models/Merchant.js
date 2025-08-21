const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    openingHours: { type: String },
    // For geospatial queries
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    },
    category: {
        type: String,
        required: true,
        enum: ['Food & Drinks', 'Fashion', 'Travel', 'Entertainment', 'Services', 'Other']
    },
    isPopular: {
        type: Boolean,
        default: false
    }
});

const merchantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Food & Drinks', 'Fashion', 'Travel', 'Entertainment', 'Services']
    },
    locations: [locationSchema],
    merchantCode: {
        type: String,
        required: true,
        unique: true
    },
    qrCode: {
        type: String, // Will store the data URL of the QR code
        required: true
    },
    isFavorite: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Add a geospatial index for location-based queries
merchantSchema.index({ location: '2dsphere' });

const Merchant = mongoose.model('Merchant', merchantSchema);

module.exports = Merchant;
