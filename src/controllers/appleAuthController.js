
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Apple Sign-In
// @route   POST /api/auth/apple
// @access  Public
const appleSignIn = async (req, res) => {
    try {
        const { identityToken, user } = req.body;

        // Verify Apple identity token (you'll need apple-signin-auth package)
        // For now, basic implementation
        if (!identityToken) {
            return res.status(400).json({ message: 'Identity token required' });
        }

        let existingUser = await User.findOne({ appleId: user?.id });

        if (!existingUser && user?.email) {
            existingUser = await User.findOne({ email: user.email });
        }

        if (existingUser) {
            if (!existingUser.appleId) {
                existingUser.appleId = user?.id;
                await existingUser.save();
            }

            return res.json({
                _id: existingUser._id,
                name: existingUser.name,
                email: existingUser.email,
                role: existingUser.role,
                token: generateToken(existingUser._id),
            });
        }

        // Create new user
        const newUser = new User({
            name: user?.name?.firstName + ' ' + user?.name?.lastName || 'Apple User',
            email: user?.email || `apple_${user?.id}@placeholder.com`,
            appleId: user?.id,
            isVerified: true,
            authProvider: 'apple'
        });

        await newUser.save();

        res.status(201).json({
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            token: generateToken(newUser._id),
        });

    } catch (error) {
        console.error('Apple sign-in error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    appleSignIn
};
