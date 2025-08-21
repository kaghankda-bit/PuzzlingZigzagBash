const subscriptionPlans = [
    // Monthly Plans
    {
        name: 'Standard',
        price: 9.99,
        currency: 'eur',
        interval: 'month',
        features: [
            'Access to all partner deals',
            'Exclusive member discounts',
            'Notifications about new offers'
        ],
        stripePriceId: 'price_standard_monthly', // Replace with your Stripe Price ID
        isPopular: false
    },
    {
        name: 'VIP',
        price: 19.99,
        currency: 'eur',
        interval: 'month',
        features: [
            'All Standard features',
            'VIP-only offers & deals',
            'Priority customer support'
        ],
        stripePriceId: 'price_vip_monthly', // Replace with your Stripe Price ID
        isPopular: true
    },
    // Yearly Plans
    {
        name: 'Standard',
        price: 99.99,
        currency: 'eur',
        interval: 'year',
        features: [
            'Save 17% - (2 months free!)',
            'Everything from the monthly plan',
            'No recurring monthly payments'
        ],
        stripePriceId: 'price_standard_yearly', // Replace with your Stripe Price ID
        isPopular: true
    },
    {
        name: 'VIP',
        price: 199.99,
        currency: 'eur',
        interval: 'year',
        features: [
            'Save 17% - (2 months free!)',
            'Everything in VIP Monthly',
            'One-time payment'
        ],
        stripePriceId: 'price_vip_yearly', // Replace with your Stripe Price ID
        isPopular: false
    }
];

module.exports = subscriptionPlans;
