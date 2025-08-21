const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { createSubscription, getSubscriptionStatus, validatePromoCode, stripeWebhook, getPaymentMethods, createSetupIntent, deletePaymentMethod, getSubscriptionPlans, changeSubscription, cancelSubscription } = require('../controllers/paymentController');

// Get all subscription plans
router.get('/plans', getSubscriptionPlans);

// Create a new subscription
router.post('/create-subscription', protect, createSubscription);

// Get user's subscription status
router.get('/subscription-status', protect, getSubscriptionStatus);

// Validate a promo code
router.post('/validate-promo', protect, validatePromoCode);

// Create a Setup Intent for adding a new payment method
router.post('/create-setup-intent', protect, createSetupIntent);

// Get all saved payment methods
router.get('/payment-methods', protect, getPaymentMethods);

// Delete a saved payment method
router.delete('/payment-methods/:id', protect, deletePaymentMethod);

// Change subscription plan
router.put('/change-subscription', protect, changeSubscription);

// Cancel subscription
router.post('/cancel-subscription', protect, cancelSubscription);

// Stripe webhook for handling payment events
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;
