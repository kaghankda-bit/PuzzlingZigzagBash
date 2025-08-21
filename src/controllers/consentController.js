
const Consent = require('../models/Consent');
const AuditLog = require('../models/AuditLog');

const grantConsent = async (req, res) => {
    try {
        const { type, partnerId } = req.body;
        
        // Check if consent already exists
        let consent = await Consent.findOne({
            user: req.user._id,
            type,
            partner: partnerId
        });

        if (consent) {
            // Update existing consent
            consent.granted = true;
            consent.grantedAt = new Date();
            consent.revokedAt = null;
        } else {
            // Create new consent
            consent = new Consent({
                user: req.user._id,
                partner: partnerId,
                type,
                granted: true,
                grantedAt: new Date(),
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                source: 'app'
            });
        }

        await consent.save();

        await AuditLog.create({
            action: 'CONSENT_GRANTED',
            userId: req.user._id,
            targetId: consent._id,
            details: { type, partnerId }
        });

        res.json({
            message: 'Consent granted successfully',
            consent
        });

    } catch (error) {
        console.error('Grant consent error:', error);
        res.status(500).json({ message: 'Failed to grant consent' });
    }
};

const revokeConsent = async (req, res) => {
    try {
        const { type, partnerId } = req.body;
        
        const consent = await Consent.findOne({
            user: req.user._id,
            type,
            partner: partnerId
        });

        if (!consent) {
            return res.status(404).json({ message: 'Consent not found' });
        }

        consent.granted = false;
        consent.revokedAt = new Date();
        await consent.save();

        await AuditLog.create({
            action: 'CONSENT_REVOKED',
            userId: req.user._id,
            targetId: consent._id,
            details: { type, partnerId }
        });

        res.json({
            message: 'Consent revoked successfully',
            consent
        });

    } catch (error) {
        console.error('Revoke consent error:', error);
        res.status(500).json({ message: 'Failed to revoke consent' });
    }
};

const getUserConsents = async (req, res) => {
    try {
        const consents = await Consent.find({ user: req.user._id })
            .populate('partner', 'businessName')
            .sort({ createdAt: -1 });

        res.json(consents);

    } catch (error) {
        console.error('Get user consents error:', error);
        res.status(500).json({ message: 'Failed to retrieve consents' });
    }
};

const exportConsents = async (req, res) => {
    try {
        const { startDate, endDate, type, partnerId } = req.query;
        
        const filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        if (type) filter.type = type;
        if (partnerId) filter.partner = partnerId;

        const consents = await Consent.find(filter)
            .populate('user', 'email name')
            .populate('partner', 'businessName')
            .sort({ createdAt: -1 });

        // Convert to CSV format
        const csvData = consents.map(consent => ({
            userId: consent.user._id,
            userEmail: consent.user.email,
            userName: consent.user.name,
            partnerName: consent.partner?.businessName || 'N/A',
            type: consent.type,
            granted: consent.granted,
            grantedAt: consent.grantedAt,
            revokedAt: consent.revokedAt,
            createdAt: consent.createdAt
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=consents.csv');
        
        // Simple CSV conversion
        const csvHeaders = Object.keys(csvData[0] || {}).join(',');
        const csvRows = csvData.map(row => Object.values(row).join(','));
        const csv = [csvHeaders, ...csvRows].join('\n');

        res.send(csv);

    } catch (error) {
        console.error('Export consents error:', error);
        res.status(500).json({ message: 'Failed to export consents' });
    }
};

module.exports = {
    grantConsent,
    revokeConsent,
    getUserConsents,
    exportConsents
};
