const express = require('express');
const router = express.Router();
const passport = require('passport');
const {
    registerUser,
    authUser,
    verifyOtp,
    resendOtp,
    updateUserProfile,
    forgotPassword,
    resetPassword,
    verifyResetOtp,
    becomePartner,
    getReferralCode,
    getTotalSavings,
    getActivity,
    getUserProfile,
    getInvitedFriends,
    deactivateUser,
    deleteUser,
    getMemberCard,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
const generateToken = require('../utils/generateToken');

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, upload.single('profilePicture'), updateUserProfile)
    .delete(protect, deleteUser);

// Get user's membership card
router.get('/my-card', protect, getMemberCard);

router.put('/deactivate', protect, deactivateUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/become-partner', protect, becomePartner);
router.get('/referral-code', protect, getReferralCode);
router.get('/savings', protect, getTotalSavings);
router.get('/activity', protect, getActivity);
router.get('/invited-friends', protect, getInvitedFriends);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/', session: false }),
    (req, res) => {
        const token = generateToken(req.user._id);
        // Redirect to frontend with token
        res.redirect(`http://localhost:3000/dashboard?token=${token}`);
    }
);

module.exports = router;