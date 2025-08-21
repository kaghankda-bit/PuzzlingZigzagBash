const Deal = require('../models/Deal');
const Partner = require('../models/Partner');
const Activity = require('../models/Activity');
const User = require('../models/User'); // Assuming User model is defined in '../models/User'
const Merchant = require('../models/Merchant'); // Assuming Merchant model is defined
const Redemption = require('../models/Redemption'); // Assuming Redemption model is defined

// @desc    Get all deals with advanced filtering
// @route   GET /api/deals
// @access  Public
const getDeals = async (req, res) => {
    try {
        const { 
            category, 
            merchant, 
            minDiscount, 
            maxDiscount, 
            latitude, 
            longitude, 
            radius,
            sortBy,
            search,
            limit = 20,
            page = 1
        } = req.query;

        let filter = { status: 'active' };
        let sort = {};

        // Category filter
        if (category) {
            filter.category = { $in: category.split(',') };
        }

        // Merchant filter
        if (merchant) {
            filter.merchant = merchant;
        }

        // Discount range filter
        if (minDiscount || maxDiscount) {
            filter.discountValue = {};
            if (minDiscount) filter.discountValue.$gte = Number(minDiscount);
            if (maxDiscount) filter.discountValue.$lte = Number(maxDiscount);
        }

        // Search filter
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Sorting
        switch (sortBy) {
            case 'popularity':
                sort = { totalRedemptions: -1, createdAt: -1 };
                break;
            case 'discount_high':
                sort = { discountValue: -1 };
                break;
            case 'discount_low':
                sort = { discountValue: 1 };
                break;
            case 'newest':
                sort = { createdAt: -1 };
                break;
            case 'expiring_soon':
                sort = { validUntil: 1 };
                break;
            default:
                sort = { createdAt: -1 };
        }

        // Location-based filtering
        let geoFilter = {};
        if (latitude && longitude && radius) {
            const lat = parseFloat(latitude);
            const lng = parseFloat(longitude);
            const radiusInMeters = parseFloat(radius) * 1000; // Convert km to meters

            geoFilter = {
                'merchant.locations.location': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [lng, lat]
                        },
                        $maxDistance: radiusInMeters
                    }
                }
            };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let aggregationPipeline = [
            { $match: filter },
            {
                $lookup: {
                    from: 'merchants',
                    localField: 'merchant',
                    foreignField: '_id',
                    as: 'merchant'
                }
            },
            { $unwind: '$merchant' }
        ];

        // Add geo filtering if location provided
        if (Object.keys(geoFilter).length > 0) {
            aggregationPipeline.push({ $match: geoFilter });
        }

        aggregationPipeline.push(
            { $sort: sort },
            { $skip: skip },
            { $limit: parseInt(limit) },
            {
                $project: {
                    title: 1,
                    description: 1,
                    category: 1,
                    image: 1,
                    discountValue: 1,
                    typeOfDiscount: 1,
                    validUntil: 1,
                    totalRedemptions: 1,
                    status: 1,
                    'merchant.name': 1,
                    'merchant.logo': 1,
                    'merchant.locations': 1
                }
            }
        );

        const deals = await Deal.aggregate(aggregationPipeline);

        // Get total count for pagination
        const totalDeals = await Deal.countDocuments(filter);
        const totalPages = Math.ceil(totalDeals / parseInt(limit));

        res.json({
            deals,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalDeals,
                hasMore: parseInt(page) < totalPages
            }
        });
    } catch (error) {
        console.error('Get deals error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper function to calculate distance between two points (not used in the aggregation pipeline version but kept for potential fallback)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};


// @desc    Get deal by ID
// @route   GET /api/deals/:id
// @access  Public
const getDealById = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id).populate('merchant', 'name locations');
        if (!deal) {
            return res.status(404).json({ message: 'Deal not found' });
        }
        res.json(deal);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Redeem a deal
// @route   POST /api/deals/:id/redeem
// @access  Private
const redeemDeal = async (req, res) => {
    try {
        const { qrCode, merchantVerificationCode } = req.body;
        const deal = await Deal.findById(req.params.id).populate('merchant');
        const user = await User.findById(req.user._id);

        if (!deal) {
            return res.status(404).json({ message: 'Deal not found' });
        }

        if (deal.status !== 'active') {
            return res.status(400).json({ message: 'Deal is not active' });
        }

        // Validate QR code (should contain deal ID and user membership ID)
        if (qrCode) {
            const expectedQRData = `${deal._id}-${user.membershipId}`;
            if (qrCode !== expectedQRData) {
                return res.status(400).json({ message: 'Invalid QR code' });
            }
        }

        // Validate merchant verification code
        if (merchantVerificationCode) {
            if (merchantVerificationCode !== deal.merchant.merchantCode) {
                return res.status(400).json({ message: 'Invalid merchant verification code' });
            }
        }

        // Check if user has already redeemed this deal recently
        const existingRedemption = await Redemption.findOne({
            user: user._id,
            deal: deal._id,
            redeemedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Within last 24 hours
        });

        if (existingRedemption) {
            return res.status(400).json({ message: 'Deal already redeemed recently' });
        }

        // Calculate savings based on discount type
        let savings = 0;
        if (deal.typeOfDiscount === 'Percentage') {
            savings = (deal.discountValue / 100) * (req.body.originalAmount || 100);
        } else {
            savings = deal.discountValue;
        }

        // Create redemption record
        const redemption = new Redemption({
            user: user._id,
            deal: deal._id,
            merchant: deal.merchant._id,
            savings: savings,
            originalAmount: req.body.originalAmount || 0,
            redeemedAt: Date.now(),
            verificationMethod: qrCode ? 'QR_CODE' : 'MERCHANT_CODE'
        });

        await redemption.save();

        // Update deal redemption count
        deal.totalRedemptions = (deal.totalRedemptions || 0) + 1;
        await deal.save();

        res.json({ 
            message: 'Deal redeemed successfully!',
            redemption,
            savings: savings,
            deal: {
                title: deal.title,
                merchant: deal.merchant.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Rate a deal
// @route   POST /api/deals/:id/rate
// @access  Private
const rateDeal = async (req, res) => {
    const { rating } = req.body; // 'like' or 'dislike'

    if (!['like', 'dislike'].includes(rating)) {
        return res.status(400).json({ message: 'Invalid rating value' });
    }

    try {
        const deal = await Deal.findById(req.params.id);

        if (!deal) {
            return res.status(404).json({ message: 'Deal not found' });
        }

        // Check if user has redeemed the deal before allowing them to rate it
        const redemption = await Redemption.findOne({ user: req.user._id, deal: req.params.id });
        if (!redemption) {
            return res.status(403).json({ message: 'You must redeem a deal before rating it' });
        }

        // Check if the user has already rated this deal
        const existingRating = deal.ratings.find(r => r.user.toString() === req.user._id.toString());

        if (existingRating) {
            // Update existing rating
            existingRating.rating = rating;
        } else {
            // Add new rating
            deal.ratings.push({ user: req.user._id, rating });
        }

        await deal.save();
        res.status(200).json({ message: 'Thank you for your feedback!' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};



// @desc    Add a deal to favorites
// @route   POST /api/deals/:id/favorite
// @access  Private
const addFavoriteDeal = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const dealId = req.params.id;

        if (!user.favoriteDeals.includes(dealId)) {
            user.favoriteDeals.push(dealId);
            await user.save();
        }

        res.status(200).json({ message: 'Deal added to favorites' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove a deal from favorites
// @route   DELETE /api/deals/:id/favorite
// @access  Private
const removeFavoriteDeal = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const dealId = req.params.id;

        user.favoriteDeals = user.favoriteDeals.filter(
            (id) => id.toString() !== dealId
        );

        await user.save();
        res.status(200).json({ message: 'Deal removed from favorites' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update the status of a deal (e.g., pause, resume) - This function is replaced by toggleDealStatus
// @route   PUT /api/deals/:id/status
// @access  Private/Partner
// const updateDealStatus = async (req, res) => {
//     const { status } = req.body; // 'active' or 'paused'

//     if (!['active', 'paused'].includes(status)) {
//         return res.status(400).json({ message: 'Invalid status value' });
//     }

//     try {
//         const deal = await Deal.findById(req.params.id);

//         if (!deal) {
//             return res.status(404).json({ message: 'Deal not found' });
//         }

//         // Authorization: Check if the logged-in user is a partner and owns this deal
//         const merchant = await Merchant.findOne({ user: req.user._id });
//         if (!merchant || deal.merchant.toString() !== merchant._id.toString()) {
//             return res.status(403).json({ message: 'User not authorized to update this deal' });
//         }

//         deal.status = status;
//         await deal.save();

//         res.json({ message: `Deal status updated to ${status}`, deal });

//     } catch (error) {
//         console.error('Update deal status error:', error);
//         res.status(500).json({ message: 'Server Error' });
//     }
// };

// @desc    Create a new deal
// @route   POST /api/deals
// @access  Private/Partner
const createDeal = async (req, res) => {
    try {
        const merchant = await Merchant.findOne({ user: req.user._id });
        if (!merchant) {
            return res.status(403).json({ message: 'User is not a partner or merchant not found' });
        }

        const dealData = { ...req.body, merchant: merchant._id };
        if (req.file) {
            dealData.image = req.file.path;
        }

        const deal = new Deal(dealData);
        await deal.save();
        res.status(201).json(deal);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update a deal
// @route   PUT /api/deals/:id
// @access  Private/Partner
const updateDeal = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id);
        if (!deal) {
            return res.status(404).json({ message: 'Deal not found' });
        }

        const merchant = await Merchant.findOne({ user: req.user._id });
        if (!merchant || deal.merchant.toString() !== merchant._id.toString()) {
            return res.status(403).json({ message: 'User not authorized to update this deal' });
        }

        const updatedData = { ...req.body };
        if (req.file) {
            updatedData.image = req.file.path;
        }

        const updatedDeal = await Deal.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        res.json(updatedDeal);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get deal statistics
// @route   GET /api/deals/:id/stats
// @access  Private/Partner
const getDealStats = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id).populate('merchant');
        if (!deal) {
            return res.status(404).json({ message: 'Deal not found' });
        }

        // Check authorization
        const merchant = await Merchant.findOne({ user: req.user._id });
        if (!merchant || deal.merchant._id.toString() !== merchant._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get redemption stats
        const redemptions = await Redemption.find({ deal: deal._id });
        const totalRedemptions = redemptions.length;
        const totalSavings = redemptions.reduce((sum, redemption) => sum + redemption.savings, 0);

        // Get daily stats for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyStats = await Redemption.aggregate([
            {
                $match: {
                    deal: deal._id,
                    redeemedAt: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$redeemedAt' } },
                    count: { $sum: 1 },
                    savings: { $sum: '$savings' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            deal: {
                title: deal.title,
                status: deal.status,
                createdAt: deal.createdAt,
                validUntil: deal.validUntil
            },
            stats: {
                totalRedemptions,
                totalSavings: totalSavings.toFixed(2),
                dailyStats,
                averageRedemptionsPerDay: totalRedemptions / 30
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Pause/Resume deal
// @route   PATCH /api/deals/:id/toggle-status
// @access  Private/Partner
const toggleDealStatus = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id);
        if (!deal) {
            return res.status(404).json({ message: 'Deal not found' });
        }

        // Check authorization
        const merchant = await Merchant.findOne({ user: req.user._id });
        if (!merchant || deal.merchant.toString() !== merchant._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Toggle status
        deal.status = deal.status === 'active' ? 'paused' : 'active';
        await deal.save();

        res.json({
            message: `Deal ${deal.status === 'active' ? 'resumed' : 'paused'} successfully`,
            deal: {
                id: deal._id,
                title: deal.title,
                status: deal.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a deal
// @route   DELETE /api/deals/:id
// @access  Private/Partner
const deleteDeal = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id);
        if (!deal) {
            return res.status(404).json({ message: 'Deal not found' });
        }

        // Check authorization
        const merchant = await Merchant.findOne({ user: req.user._id });
        if (!merchant || deal.merchant.toString() !== merchant._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this deal' });
        }

        await deal.remove();
        res.json({ message: 'Deal removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getPartnerDeals = async (req, res) => {
    try {
        const partner = await Partner.findOne({ user: req.user.id });
        if (!partner) {
            return res.status(403).json({ message: 'User is not a partner' });
        }

        const deals = await Deal.find({ partner: partner._id });
        res.json(deals);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Placeholder functions for functionalities that were mentioned but not implemented in this snippet
// const searchDeals = async (req, res) => {
//     res.status(501).json({ message: 'Search deals not implemented yet' });
// };
// const getTopDeals = async (req, res) => {
//     res.status(501).json({ message: 'Get top deals not implemented yet' });
// };

module.exports = {
    getDeals,
    getDealById,
    redeemDeal,
    rateDeal,
    addFavoriteDeal,
    removeFavoriteDeal,
    // updateDealStatus, // This function is replaced by toggleDealStatus
    createDeal,
    updateDeal,
    deleteDeal,
    getPartnerDeals,
    getDealStats,
    toggleDealStatus
};