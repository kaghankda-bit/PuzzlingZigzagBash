const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    partner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Partner',
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'HR Manager', 'Finance Manager', 'QR Checker'],
        required: true
    },
    outlet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location' // Assuming you have a Location model for selling points
    }
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
