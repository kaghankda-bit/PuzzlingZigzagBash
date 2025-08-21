
const express = require('express');
const router = express.Router();
const {
    createSubscription,
    cancelSubscription,
    updateSubscription,
    getSubscriptionStatus,
    handleWebhook,
    createPaymentIntent
} = require('../controllers/stripeController');
const { protect } = require('../middlewares/authMiddleware');

// Subscription routes
router.post('/create-subscription', protect, createSubscription);
router.post('/cancel-subscription', protect, cancelSubscription);
router.put('/update-subscription', protect, updateSubscription);
router.get('/subscription-status', protect, getSubscriptionStatus);
router.post('/create-payment-intent', protect, createPaymentIntent);

// Webhook route (no auth middleware needed)
router.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);

module.exports = router;
