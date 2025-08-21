const deals = [
    {
        title: "Buy 1 Coffee Get 1 Coffee free",
        description: "Buy any tall or grande beverage and get one of equal or lesser value free.",
        category: "Food & Drinks",
        originalPrice: 5.99,
        discountedPrice: 2.99,
        discountPercentage: 50,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        image: "/uploads/sample/deal-coffee.jpg",
        maxRedemptions: 1000,
        currentRedemptions: 0,
        status: "active",
        partnerId: null, // Will be populated during seeding
        merchantId: null, // Will be populated during seeding
    },
    {
        title: "Buy Coffee & Get Free Pancake",
        description: "Enjoy a free stack of pancakes with the purchase of any specialty coffee.",
        category: "Food & Drinks",
        originalPrice: 12.99,
        discountedPrice: 7.99,
        discountPercentage: 38,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        image: "/uploads/sample/deal-pancake.jpg",
        maxRedemptions: 1000,
        currentRedemptions: 0,
        status: "active",
        partnerId: null, // Will be populated during seeding
        merchantId: null, // Will be populated during seeding
    },
    {
        title: "Get Free Handcrafted Food",
        description: "Get a free handcrafted food item when you spend over $20.",
        category: "Fashion",
        originalPrice: 15.00,
        discountedPrice: 0.00,
        discountPercentage: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        image: "/uploads/sample/deal-food.jpg",
        maxRedemptions: 1000,
        currentRedemptions: 0,
        status: "active",
        partnerId: null, // Will be populated during seeding
        merchantId: null, // Will be populated during seeding
    }
];

module.exports = deals;