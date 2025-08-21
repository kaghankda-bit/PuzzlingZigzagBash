const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Check if token exists
            if (!token) {
                return res.status(401).json({ message: 'Not authorized, no token' });
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};

const isPartnerAdmin = async (req, res, next) => {
    if (req.user && req.user.role === 'Partner') {
        // Here you would add logic to check if the user is an admin of the partner company
        // For now, we'll just check the role
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a partner admin' });
    }
};

module.exports = { protect, isAdmin, isPartnerAdmin };
