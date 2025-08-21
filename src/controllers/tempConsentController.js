
const Consent = require('../models/Consent');

// @desc    Record or update a user's consent
// @route   POST /api/consent
// @access  Private
const recordConsent = async (req, res) => {
    try {
        const { type, granted, version } = req.body;
        const userId = req.user._id;

        const consentData = {
            user: userId,
            type,
            granted,
            version: version || '1.0',
            recordedAt: new Date()
        };

        const existingConsent = await Consent.findOne({ user: userId, type });

        if (existingConsent) {
            await Consent.findByIdAndUpdate(existingConsent._id, consentData);
        } else {
            await Consent.create(consentData);
        }

        res.json({ message: 'Consent recorded successfully' });
    } catch (error) {
        console.error('Record consent error:', error);
        res.status(500).json({ message: 'Failed to record consent' });
    }
};

// @desc    Get the current consent status for a user
// @route   GET /api/consent/:type
// @access  Private
const getConsentStatus = async (req, res) => {
    try {
        const { type } = req.params;
        const userId = req.user._id;

        const consent = await Consent.findOne({ user: userId, type });

        if (!consent) {
            return res.status(404).json({ message: 'Consent record not found' });
        }

        res.json(consent);
    } catch (error) {
        console.error('Get consent status error:', error);
        res.status(500).json({ message: 'Failed to get consent status' });
    }
};

// @desc    Get the consent history for a user (for admin)
// @route   GET /api/consent/history/:userId
// @access  Private/Admin
const getConsentHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        const consentHistory = await Consent.find({ user: userId })
            .sort({ recordedAt: -1 });

        res.json(consentHistory);
    } catch (error) {
        console.error('Get consent history error:', error);
        res.status(500).json({ message: 'Failed to get consent history' });
    }
};

module.exports = {
    recordConsent,
    getConsentStatus,
    getConsentHistory
};
