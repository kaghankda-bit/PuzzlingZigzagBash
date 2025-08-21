
const mongoose = require('mongoose');

const outletSchema = new mongoose.Schema({
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    contactInfo: {
        phone: String,
        email: String
    },
    businessHours: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        isOpen: {
            type: Boolean,
            default: true
        },
        openTime: String, // "09:00"
        closeTime: String, // "18:00"
        breaks: [{
            startTime: String,
            endTime: String,
            reason: String
        }]
    }],
    facilities: [String], // ["WiFi", "Parking", "Wheelchair Accessible"]
    isActive: {
        type: Boolean,
        default: true
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

outletSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Outlet', outletSchema);
