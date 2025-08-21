const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    newDealsAlert: { type: Boolean, default: true },
    specialPromotions: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    expirationAlerts: { type: Boolean, default: true },
    storeNearbyDeals: { type: Boolean, default: false },
    appUpdatesAndNews: { type: Boolean, default: false },
    birthdayRewards: { type: Boolean, default: false },
    locationBasedRewards: { type: Boolean, default: false },
    importantAnnouncements: { type: Boolean, default: true },
}, { timestamps: true });

const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);

module.exports = NotificationSettings;
