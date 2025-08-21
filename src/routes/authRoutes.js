const express = require('express');
const passport = require('passport');
const router = express.Router();
const generateToken = require('../utils/generateToken');

// @desc    Auth with Google
// @route   GET /api/auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google auth callback
// @route   GET /api/auth/google/callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    const token = generateToken(req.user._id);
    // Redirect to a frontend route with the token
    // The frontend will be responsible for storing the token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

// @desc    Auth with Apple
// @route   GET /api/auth/apple
router.get('/apple', passport.authenticate('apple'));

// @desc    Apple auth callback
// @route   GET /api/auth/apple/callback
router.get('/apple/callback', passport.authenticate('apple', { failureRedirect: '/login' }), (req, res) => {
    const token = generateToken(req.user._id);
    // Redirect to a frontend route with the token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

module.exports = router;
