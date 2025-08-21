const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Partner = require('../models/Partner');

// @desc    Create a Stripe checkout session for a new subscription
// @route   POST /api/stripe/create-checkout-session
// @access  Private
const createCheckoutSession = async (req, res) => {
    const { priceId, userType } = req.body;
    const user = req.user;

    try {
        let customerId;
        let model;
        let query;

        if (userType === 'Partner') {
            model = await Partner.findOne({ userAccount: user._id });
            query = { userAccount: user._id };
        } else {
            model = user;
            query = { _id: user._id };
        }

        if (!model) {
            return res.status(404).json({ message: `${userType} not found` });
        }

        customerId = model.stripeCustomerId;

        // If the user/partner is not yet a Stripe customer, create one
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: model.email,
                name: model.name,
                metadata: {
                    userId: user._id.toString(),
                    userType: userType
                }
            });
            customerId = customer.id;

            // Save the new customer ID to the database
            if (userType === 'Partner') {
                await Partner.updateOne(query, { stripeCustomerId: customerId });
            } else {
                await User.updateOne(query, { stripeCustomerId: customerId });
            }
        }

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            customer: customerId,
            success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        res.status(500).json({ message: 'Server error while creating checkout session.', error: error.message });
    }
};

// @desc    Create a Stripe customer portal session to manage a subscription
// @route   POST /api/stripe/create-portal-session
// @access  Private
const createPortalSession = async (req, res) => {
    const user = req.user;
    const { userType } = req.body;

    try {
        let model;
        if (userType === 'Partner') {
            model = await Partner.findOne({ userAccount: user._id });
        } else {
            model = user;
        }

        if (!model || !model.stripeCustomerId) {
            return res.status(404).json({ message: 'Stripe customer not found.' });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: model.stripeCustomerId,
            return_url: `${process.env.FRONTEND_URL}/profile`,
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('Stripe Portal Error:', error);
        res.status(500).json({ message: 'Server error while creating portal session.', error: error.message });
    }
};

// @desc    Stripe webhook handler
// @route   POST /api/stripe/webhook
// @access  Public
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            const customerId = invoice.customer;
            const subscriptionId = invoice.subscription;

            // Find user or partner by Stripe customer ID
            let user = await User.findOne({ stripeCustomerId: customerId });
            let partner = await Partner.findOne({ stripeCustomerId: customerId });

            if (user) {
                user.subscriptionStatus = 'active';
                await user.save();
            } else if (partner) {
                partner.subscriptionId = subscriptionId;
                partner.subscriptionStatus = 'active';
                await partner.save();
            }
            break;

        case 'customer.subscription.deleted':
        case 'customer.subscription.updated':
            const subscription = event.data.object;
            const subCustomerId = subscription.customer;
            const status = subscription.status;

            let subUser = await User.findOne({ stripeCustomerId: subCustomerId });
            let subPartner = await Partner.findOne({ stripeCustomerId: subCustomerId });

            const newStatus = (status === 'active') ? 'active' : 'canceled';

            if (subUser) {
                subUser.subscriptionStatus = newStatus;
                await subUser.save();
            } else if (subPartner) {
                subPartner.subscriptionStatus = newStatus;
                await subPartner.save();
            }
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

module.exports = {
    createCheckoutSession,
    createPortalSession,
    handleWebhook
};
