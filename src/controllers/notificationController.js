const admin = require('../config/firebase'); // Import initialized Firebase admin
const NotificationSettings = require('../models/NotificationSettings');
const NotificationTemplate = require('../models/NotificationTemplate'); // Assuming this model exists
const User = require('../models/User');

// @desc    Get notification settings for the current user
// @route   GET /api/notifications/settings
// @access  Private
const getNotificationSettings = async (req, res) => {
    try {
        let settings = await NotificationSettings.findOne({ user: req.user._id });

        if (!settings) {
            // If no settings exist, create them with default values
            settings = new NotificationSettings({ user: req.user._id });
            await settings.save();
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update notification settings for the current user
// @route   PUT /api/notifications/settings
// @access  Private
const updateNotificationSettings = async (req, res) => {
    try {
        let settings = await NotificationSettings.findOne({ user: req.user._id });

        if (!settings) {
            return res.status(404).json({ message: 'Notification settings not found.' });
        }

        // Update settings based on request body
        Object.keys(req.body).forEach(key => {
            if (key in settings && typeof settings[key] === 'boolean') {
                settings[key] = req.body[key];
            }
        });

        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Send push notification
// @route   POST /api/notifications/send
// @access  Private/Admin
const sendPushNotification = async (req, res) => {
    try {
        const { title, body, filters, targetType } = req.body;

        let targetUsers = [];

        if (targetType === 'all') {
            targetUsers = await User.find({ fcmToken: { $exists: true, $ne: null } });
        } else if (targetType === 'filtered') {
            const query = {};
            
            if (filters.location) {
                query['location.city'] = filters.location;
            }
            if (filters.birthday) {
                const today = new Date();
                query.$expr = {
                    $and: [
                        { $eq: [{ $dayOfMonth: '$dateOfBirth' }, today.getDate()] },
                        { $eq: [{ $month: '$dateOfBirth' }, today.getMonth() + 1] }
                    ]
                };
            }
            if (filters.subscriptionStatus) {
                query.subscriptionStatus = filters.subscriptionStatus;
            }
            if (filters.company) {
                query.company = filters.company;
            }

            targetUsers = await User.find({
                ...query,
                fcmToken: { $exists: true, $ne: null }
            });
        }

        const tokens = targetUsers.map(user => user.fcmToken).filter(Boolean);

        if (tokens.length === 0) {
            return res.status(400).json({ message: 'No valid FCM tokens found' });
        }

        const message = {
            notification: { title, body },
            tokens: tokens.slice(0, 500) // Firebase limit
        };

        const response = await admin.messaging().sendMulticast(message);

        res.json({
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            totalSent: tokens.length
        });

    } catch (error) {
        console.error('Push notification error:', error);
        res.status(500).json({ message: 'Failed to send notification' });
    }
};

// @desc    Schedule notification
// @route   POST /api/notifications/schedule
// @access  Private/Admin
const scheduleNotification = async (req, res) => {
    try {
        const { title, body, scheduledTime, recurring, filters } = req.body;

        const notification = new NotificationTemplate({
            title,
            body,
            scheduledTime: new Date(scheduledTime),
            recurring,
            filters,
            status: 'scheduled',
            createdBy: req.user._id
        });

        await notification.save();

        res.status(201).json({
            message: 'Notification scheduled successfully',
            notification
        });

    } catch (error) {
        console.error('Schedule notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get notification templates
// @route   GET /api/notifications/templates
// @access  Private/Admin
const getNotificationTemplates = async (req, res) => {
    try {
        const templates = await NotificationTemplate.find()
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.json(templates);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getNotificationSettings,
    updateNotificationSettings,
    sendPushNotification,
    scheduleNotification,
    getNotificationTemplates
};
