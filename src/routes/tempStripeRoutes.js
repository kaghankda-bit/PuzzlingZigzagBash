const express = require('express');
const router = express.Router();
const {
    createCheckoutSession,
    createPortalSession,
    handleWebhook
} = require('../controllers/tempStripeController');
const { protect } = require('../middlewares/authMiddleware');

// @desc    Create a Stripe checkout session for a new subscription
// @route   POST /api/stripe/create-checkout-session
// @access  Private
router.post('/create-checkout-session', protect, createCheckoutSession);

// @desc    Create a Stripe customer portal session to manage a subscription
// @route   POST /api/stripe/create-portal-session
// @access  Private
router.post('/create-portal-session', protect, createPortalSession);

// @desc    Stripe webhook handler
// @route   POST /api/stripe/webhook
// @access  Public (Webhook comes from Stripe)
// The express.raw middleware is needed to get the raw body from the request, which Stripe requires for signature verification.
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
