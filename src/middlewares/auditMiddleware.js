const AuditLog = require('../models/AuditLog');

const audit = (action, resource) => async (req, res, next) => {
    // Let the route handler execute first
    res.on('finish', async () => {
        // We only want to log successful actions
        if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
                const log = new AuditLog({
                    action,
                    resource,
                    resourceId: req.params.id || req.body.id || req.user.id, // Attempt to get ID from params, body, or user
                    performedBy: req.user._id,
                    details: {
                        body: req.body,
                        params: req.params,
                        query: req.query
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });
                await log.save();
            } catch (error) {
                console.error('Failed to save audit log:', error);
            }
        }
    });

    next();
};

module.exports = { audit };
