
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// @desc    Create subscription
// @route   POST /api/stripe/create-subscription
// @access  Private
const createSubscription = async (req, res) => {
    try {
        const { priceId, paymentMethodId } = req.body;
        const user = req.user;

        // Create customer if doesn't exist
        let customer;
        if (user.stripeCustomerId) {
            customer = await stripe.customers.retrieve(user.stripeCustomerId);
        } else {
            customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
            });
            user.stripeCustomerId = customer.id;
            await user.save();
        }

        // Attach payment method
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customer.id,
        });

        // Set default payment method
        await stripe.customers.update(customer.id, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_settings: {
                payment_method_options: {
                    card: { request_three_d_secure: 'if_required' },
                },
                payment_method_types: ['card'],
                save_default_payment_method: 'on_subscription',
            },
            expand: ['latest_invoice.payment_intent'],
        });

        // Save subscription to database
        const newSubscription = new Subscription({
            user: user._id,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            plan: priceId === process.env.STRIPE_VIP_PRICE_ID ? 'VIP' : 'Standard'
        });

        await newSubscription.save();

        res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        });

    } catch (error) {
        console.error('Stripe subscription error:', error);
        res.status(500).json({ message: 'Payment processing error' });
    }
};

// @desc    Cancel subscription
// @route   POST /api/stripe/cancel-subscription
// @access  Private
const cancelSubscription = async (req, res) => {
    try {
        const user = req.user;
        const subscription = await Subscription.findOne({ user: user._id, status: 'active' });

        if (!subscription) {
            return res.status(404).json({ message: 'No active subscription found' });
        }

        await stripe.subscriptions.del(subscription.stripeSubscriptionId);

        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
        await subscription.save();

        res.json({ message: 'Subscription cancelled successfully' });

    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Webhook handler
// @route   POST /api/stripe/webhook
// @access  Public
const handleWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'invoice.payment_succeeded':
            const invoice = event.data.object;
            await Subscription.findOneAndUpdate(
                { stripeSubscriptionId: invoice.subscription },
                { status: 'active', lastPaymentDate: new Date() }
            );
            break;
        case 'invoice.payment_failed':
            await Subscription.findOneAndUpdate(
                { stripeSubscriptionId: event.data.object.subscription },
                { status: 'past_due' }
            );
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
};

module.exports = {
    createSubscription,
    cancelSubscription,
    handleWebhook
};
