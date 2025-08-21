const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const PromoCode = require('../models/PromoCode');
const SubscriptionPlan = require('../models/SubscriptionPlan');

// @desc    Create a Stripe checkout session for a new subscription
// @route   POST /api/payments/create-subscription
// @access  Private
const createSubscription = async (req, res) => {
    const { priceId, promoCode } = req.body;
    const user = await User.findById(req.user._id);

    try {
        let stripeCustomerId = user.stripeCustomerId;

        // Create a Stripe customer if one doesn't exist
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: {
                    userId: user._id.toString()
                }
            });
            stripeCustomerId = customer.id;
            user.stripeCustomerId = stripeCustomerId;
            await user.save();
        }

        // Create the subscription checkout session
        const sessionOptions = {
            payment_method_types: ['card'],
            mode: 'subscription',
            customer: stripeCustomerId,
            line_items: [{
                price: priceId, // e.g., price_12345
                quantity: 1,
            }],
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
        };

        // Apply promo code if provided
        if (promoCode) {
            const promotionCodes = await stripe.promotionCodes.list({
                code: promoCode,
                active: true,
                limit: 1
            });

            if (promotionCodes.data.length > 0) {
                sessionOptions.discounts = [{ promotion_code: promotionCodes.data[0].id }];
            } else {
                return res.status(400).json({ message: 'Invalid promo code' });
            }
        }

        const session = await stripe.checkout.sessions.create(sessionOptions);

        res.json({ id: session.id });

    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get the current user's subscription status
// @route   GET /api/payments/subscription-status
// @access  Private
const getSubscriptionStatus = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ user: req.user._id });

        if (!subscription) {
            return res.status(404).json({ message: 'No subscription found for this user.' });
        }

        const plan = await SubscriptionPlan.findOne({ stripePriceId: subscription.stripePriceId });

        res.json({
            subscription,
            plan
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Validate a promo code
// @route   POST /api/payments/validate-promo
// @access  Private
const validatePromoCode = async (req, res) => {
    const { code } = req.body;

    try {
        const promoCode = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });

        if (!promoCode) {
            return res.status(404).json({ message: 'Promo code not found or is inactive.' });
        }

        // Check if the promo code is expired
        if (promoCode.validUntil && promoCode.validUntil < new Date()) {
            return res.status(400).json({ message: 'This promo code has expired.' });
        }

        // Check if the promo code has reached its usage limit
        if (promoCode.maxUses && promoCode.timesUsed >= promoCode.maxUses) {
            return res.status(400).json({ message: 'This promo code has reached its usage limit.' });
        }

        res.json({
            message: 'Promo code is valid.',
            discountType: promoCode.discountType,
            discountValue: promoCode.discountValue
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Stripe webhook handler
// @route   POST /api/payments/stripe-webhook
// @access  Public
const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.log(`Error message: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            // Find the user and create a new subscription record
            const user = await User.findOne({ stripeCustomerId: session.customer });
            if (user) {
                const subscription = new Subscription({
                    user: user._id,
                    stripeSubscriptionId: session.subscription,
                    stripeCustomerId: session.customer,
                    stripePriceId: session.line_items.data[0].price.id,
                    status: 'active' // Or whatever the initial status is
                });
                await subscription.save();
                user.subscriptionStatus = 'active';
                await user.save();

                // Handle referral reward
                if (user.referredBy) {
                    const newSubscriptionId = session.subscription;
                    const trialEndDate = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days from now

                    // Give the new user a 30-day trial
                    await stripe.subscriptions.update(newSubscriptionId, {
                        trial_end: trialEndDate,
                    });

                    // Give the referrer a 30-day trial
                    const referrer = await User.findById(user.referredBy);
                    const referrerSubscription = await Subscription.findOne({ user: referrer._id, status: 'active' });

                    if (referrer && referrerSubscription) {
                        await stripe.subscriptions.update(referrerSubscription.stripeSubscriptionId, {
                            trial_end: trialEndDate,
                        });
                    }
                }
            }
            break;
        }
        case 'customer.subscription.updated': {
            const subscription = event.data.object;
            // Update subscription status in our database
            const sub = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
            if (sub) {
                sub.status = subscription.status;
                sub.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
                await sub.save();

                const user = await User.findById(sub.user);
                if(user) {
                    user.subscriptionStatus = subscription.status;
                    await user.save();
                }
            }
            break;
        }
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            // Update subscription status in our database
            const sub = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
            if (sub) {
                sub.status = 'canceled';
                await sub.save();

                const user = await User.findById(sub.user);
                if(user) {
                    user.subscriptionStatus = 'canceled';
                    await user.save();
                }
            }
            break;
        }
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

// @desc    Get all of a user's saved payment methods
// @route   GET /api/payments/payment-methods
// @access  Private
const getPaymentMethods = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user.stripeCustomerId) {
        return res.json([]); // No payment methods if no Stripe customer ID
    }

    try {
        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
        });

        res.json(paymentMethods.data);
    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a Stripe Setup Intent to save a new payment method
// @route   POST /api/payments/create-setup-intent
// @access  Private
const createSetupIntent = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user.stripeCustomerId) {
        return res.status(400).json({ message: 'Stripe customer not found for this user.' });
    }

    try {
        const setupIntent = await stripe.setupIntents.create({
            customer: user.stripeCustomerId,
            payment_method_types: ['card'],
        });

        res.json({ clientSecret: setupIntent.client_secret });
    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a saved payment method
// @route   DELETE /api/payments/payment-methods/:id
// @access  Private
const deletePaymentMethod = async (req, res) => {
    const { id } = req.params; // This is the payment method ID from Stripe (e.g., pm_12345)

    try {
        // Detach the payment method from the customer in Stripe
        const paymentMethod = await stripe.paymentMethods.detach(id);

        res.json({ message: 'Payment method deleted successfully.', paymentMethod });
    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all available subscription plans
// @route   GET /api/payments/plans
// @access  Public
const getSubscriptionPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find({});
        res.json(plans);
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Change a user's subscription plan
// @route   PUT /api/payments/change-subscription
// @access  Private
const changeSubscription = async (req, res) => {
    const { newPriceId } = req.body;
    try {
        const subscription = await Subscription.findOne({ user: req.user._id, status: 'active' });

        if (!subscription) {
            return res.status(404).json({ message: 'No active subscription found.' });
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

        const updatedSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: false,
            items: [{
                id: stripeSubscription.items.data[0].id,
                price: newPriceId,
            }],
            proration_behavior: 'create_prorations',
        });

        res.json(updatedSubscription);
    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Cancel a user's subscription
// @route   POST /api/payments/cancel-subscription
// @access  Private
const cancelSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ user: req.user._id, status: 'active' });

        if (!subscription) {
            return res.status(404).json({ message: 'No active subscription found.' });
        }

        const canceledSubscription = await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });

        res.json(canceledSubscription);
    } catch (error) {
        console.error('Stripe Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createSubscription, getSubscriptionStatus, validatePromoCode, stripeWebhook, getPaymentMethods, createSetupIntent, deletePaymentMethod, getSubscriptionPlans, changeSubscription, cancelSubscription };
