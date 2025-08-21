
const AuditLog = require('../models/AuditLog');

const createAuditLog = async (action, resource, resourceId, performedBy, details = {}, req = null) => {
    try {
        const auditLog = new AuditLog({
            action,
            resource,
            resourceId,
            performedBy,
            details,
            ipAddress: req ? req.ip : null,
            userAgent: req ? req.get('User-Agent') : null
        });
        
        await auditLog.save();
        return auditLog;
    } catch (error) {
        console.error('Error creating audit log:', error);
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 10, action, resource, userId } = req.query;
        const query = {};

        if (action) query.action = action;
        if (resource) query.resource = resource;
        if (userId) query.performedBy = userId;

        const logs = await AuditLog.find(query)
            .populate('performedBy', 'name email')
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await AuditLog.countDocuments(query);

        res.json({
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createAuditLog,
    getAuditLogs
};
