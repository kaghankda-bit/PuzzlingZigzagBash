
const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs with filtering
// @route   GET /api/audit
// @access  Private/Admin
const getAuditLogs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            action,
            user,
            startDate,
            endDate
        } = req.query;

        const filter = {};
        
        if (action) filter.action = action;
        if (user) filter.user = user;
        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const skip = (page - 1) * limit;
        
        const auditLogs = await AuditLog.find(filter)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await AuditLog.countDocuments(filter);

        res.json({
            auditLogs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
};

module.exports = {
    getAuditLogs
};
