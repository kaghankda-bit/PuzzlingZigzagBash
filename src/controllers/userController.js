const User = require('../models/User');
const Redemption = require('../models/Redemption');
const sendEmail = require('../utils/email');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const { customAlphabet } = require('nanoid');
const NotificationSettings = require('../models/NotificationSettings');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const ActivationCode = require('../models/ActivationCode');

const registerUser = async (req, res) => {
    const { name, email, password, activationCode, referralCode } = req.body;
    let role = 'Member'; // Default role

    // Validate activation code if provided
    if (activationCode) {
        const validCode = await ActivationCode.findOne({
            code: activationCode.toUpperCase(),
            isActive: true,
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ],
            $expr: { $lt: ['$usedCount', '$usageLimit'] }
        });

        if (!validCode) {
            return res.status(400).json({ message: 'Invalid or expired activation code' });
        }

        role = validCode.type;
        
        // Increment usage count
        validCode.usedCount += 1;
        await validCode.save();
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate and hash OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Generate a unique referral code
        const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
        let newReferralCode;
        let isCodeUnique = false;
        while (!isCodeUnique) {
            newReferralCode = nanoid();
            const existingUser = await User.findOne({ referralCode: newReferralCode });
            if (!existingUser) {
                isCodeUnique = true;
            }
        }

        const user = new User({
            name,
            email,
            password,
            role,
            otp: hashedOtp,
            otpExpires: Date.now() + 10 * 60 * 1000, // 10 minutes
            referralCode: newReferralCode
        });

        // Handle referral
        if (referralCode) {
            const referringUser = await User.findOne({ referralCode });
            if (referringUser) {
                user.referredBy = referringUser._id;
                referringUser.referrals.push(user._id);
                await referringUser.save();
            }
        }

        await user.save();

        // Send OTP to email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Your OTP for Privilege App',
                message: `Your OTP is: ${otp}`,
            });

            res.status(201).json({
                message: 'User registered successfully. Please check your email for the OTP.',
                userId: user._id
            });

        } catch (error) {
            console.error('Error sending email:', error);
            // Should we delete the user here?
            return res.status(500).json({ message: 'Error sending verification email' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User is already verified' });
        }

        // Generate and hash OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.otp = hashedOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send OTP to email
        try {
            await sendEmail({
                email: user.email,
                subject: 'Your New OTP for Privilege App',
                message: `Your new OTP is: ${otp}`,
            });

            res.json({ message: 'New OTP sent to your email' });

        } catch (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: 'Error sending new OTP' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
            user.gender = req.body.gender || user.gender;
            user.birthdate = req.body.birthdate || user.birthdate;

            if (req.body.password) {
                user.password = req.body.password;
            }

            if (req.file) {
                user.profilePicture = req.file.path;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phoneNumber: updatedUser.phoneNumber,
                gender: updatedUser.gender,
                birthdate: updatedUser.birthdate,
                role: updatedUser.role,
                profilePicture: updatedUser.profilePicture,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Forgot password - send OTP
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // To prevent email enumeration, we don't reveal that the user doesn't exist.
            // We'll send a success response, but no email will be sent.
            return res.json({ message: 'If a user with that email exists, a password reset OTP has been sent.' });
        }

        // Generate and hash OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otp, 10);

        user.resetPasswordToken = hashedOtp;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        // Send email with OTP
        try {
            await sendEmail({
                email: user.email,
                subject: 'Your Password Reset OTP',
                message: `Your OTP to reset your password is: ${otp}. It will expire in 10 minutes.`,
            });

            res.json({ message: 'If a user with that email exists, a password reset OTP has been sent.' });

        } catch (error) {
            console.error('Error sending email:', error);
            // Don't revert user changes, they can try again.
            return res.status(500).json({ message: 'Error sending email' });
        }

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify reset password OTP
// @route   POST /api/users/verify-reset-otp
// @access  Public
const verifyResetOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({
            email,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP or OTP has expired' });
        }

        const isMatch = await bcrypt.compare(otp, user.resetPasswordToken);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        res.json({ message: 'OTP verified successfully', canResetPassword: true });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset password with OTP
// @route   PUT /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { email, otp, password } = req.body;

    try {
        const user = await User.findOne({
            email,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid OTP or OTP has expired' });
        }

        const isMatch = await bcrypt.compare(otp, user.resetPasswordToken);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Set new password
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        // We should also re-verify the user if they are resetting password
        user.isVerified = true; 

        await user.save();

        // Log the user in and send a token
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Upgrade user to Partner
// @route   POST /api/users/become-partner
// @access  Private
const becomePartner = async (req, res) => {
    const { activationCode } = req.body;

    // In a real app, this code would be more secure and unique per user/partner
    if (!activationCode || activationCode !== 'PARTNER_CODE') {
        return res.status(400).json({ message: 'Invalid activation code' });
    }

    try {
        const user = await User.findById(req.user._id);

        if (user.role === 'Partner') {
            return res.status(400).json({ message: 'User is already a Partner' });
        }

        user.role = 'Partner';
        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id), // Re-issue token with new role
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user's referral code
// @route   GET /api/users/referral-code
// @access  Private
const getReferralCode = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('referralCode referrals');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            referralCode: user.referralCode,
            referralCount: user.referrals.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get total savings for a user
// @route   GET /api/users/savings
// @access  Private
const getTotalSavings = async (req, res) => {
    try {
        const redemptions = await Redemption.find({ user: req.user._id });

        const totalSavings = redemptions.reduce((acc, item) => acc + item.savings, 0);

        res.json({ totalSavings: totalSavings.toFixed(2) });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user activity (redeemed deals)
// @route   GET /api/users/activity
// @access  Private
const getActivity = async (req, res) => {
    try {
        const redemptions = await Redemption.find({ user: req.user._id })
            .populate('deal', 'title description image')
            .populate('merchant', 'name logo')
            .sort({ redeemedAt: -1 });

        res.json(redemptions);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -otp -resetPasswordToken');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const googleAuthCallback = (req, res) => {
    // This is handled in the route, but we need to export the function
};

// @desc    Get list of invited friends
// @route   GET /api/users/invited-friends
// @access  Private
const deactivateUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = false;
        user.deactivatedAt = Date.now();
        await user.save();

        res.json({ message: 'Account deactivated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Also delete related notification settings
        await NotificationSettings.deleteOne({ user: req.user._id });

        await user.remove();

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getInvitedFriends = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('referrals', 'name createdAt subscriptionStatus');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const invitedFriends = user.referrals.map(friend => ({
            name: friend.name,
            joinedDate: friend.createdAt,
            status: friend.subscriptionStatus === 'active' ? '1 month earned' : 'Invitation sent'
        }));

        res.json(invitedFriends);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user's membership card details
// @route   GET /api/users/my-card
// @access  Private
const getMemberCard = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate membershipId if it doesn't exist
        if (!user.membershipId) {
            user.membershipId = uuidv4();
            await user.save();
        }

        // Get subscription details
        const subscription = await Subscription.findOne({ user: user._id, status: 'active' });
        let plan = null;
        if (subscription) {
            plan = await SubscriptionPlan.findOne({ stripePriceId: subscription.stripePriceId });
        }

        // Generate QR Code
        const qrCodeDataUrl = await qrcode.toDataURL(user.membershipId);

        res.json({
            name: user.name,
            profilePicture: user.profilePicture,
            membershipId: user.membershipId,
            planName: plan ? plan.name.split(' ')[0] : 'No Plan', // e.g., 'Standard' or 'VIP'
            expiresOn: subscription ? subscription.currentPeriodEnd : null,
            qrCode: qrCodeDataUrl,
        });

    } catch (error) {
        console.error('Error generating member card:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { registerUser, authUser, googleAuthCallback, verifyOtp, resendOtp, updateUserProfile, forgotPassword, resetPassword, verifyResetOtp, becomePartner, getReferralCode, getTotalSavings, getActivity, getUserProfile, getInvitedFriends, deactivateUser, deleteUser, getMemberCard };
