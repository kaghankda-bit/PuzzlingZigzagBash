const Merchant = require('../models/Merchant');
const Deal = require('../models/Deal');
const User = require('../models/User');

// @desc    Get all merchants
// @route   GET /api/merchants
// @access  Public
const getMerchants = async (req, res) => {
    const { search, category, popular, lat, lon, radius, favorites } = req.query;
    const query = {};

    if (search) {
        query.name = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    if (category) {
        query.category = category;
    }

    if (popular === 'true') {
        query.isPopular = true;
    }

    // Geospatial query
    if (lat && lon) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        const searchRadius = parseFloat(radius) || 5000; // Default to 5km

        query.location = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude]
                },
                $maxDistance: searchRadius // in meters
            }
        };
    }

    try {
        let merchants;
        if (favorites === 'true' && req.user) {
            const user = await User.findById(req.user._id).populate('favoriteMerchants');
            merchants = user.favoriteMerchants;
        } else {
            merchants = await Merchant.find(query);
        }

        // If a user is logged in, mark their favorite merchants
        if (req.user) {
            const user = await User.findById(req.user._id);
            const favoriteIds = user.favoriteMerchants.map(id => id.toString());
            merchants = merchants.map(merchant => {
                const m = merchant.toObject();
                m.isFavorite = favoriteIds.includes(m._id.toString());
                return m;
            });
        }

        res.json(merchants);

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get merchant by ID
// @route   GET /api/merchants/:id
// @access  Public
const getMerchantById = async (req, res) => {
    try {
        const merchant = await Merchant.findById(req.params.id);
        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }
        res.json(merchant);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get deals for a merchant
// @route   GET /api/merchants/:id/deals
// @access  Public
const getMerchantDeals = async (req, res) => {
    try {
        const deals = await Deal.find({ merchant: req.params.id });
        res.json(deals);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Add a merchant to favorites
// @route   POST /api/merchants/:id/favorite
// @access  Private
const addFavoriteMerchant = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const merchantId = req.params.id;

        if (!user.favoriteMerchants.includes(merchantId)) {
            user.favoriteMerchants.push(merchantId);
            await user.save();
        }

        res.status(200).json({ message: 'Merchant added to favorites' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove a merchant from favorites
// @route   DELETE /api/merchants/:id/favorite
// @access  Private
const removeFavoriteMerchant = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const merchantId = req.params.id;

        user.favoriteMerchants = user.favoriteMerchants.filter(
            (id) => id.toString() !== merchantId
        );

        await user.save();
        res.status(200).json({ message: 'Merchant removed from favorites' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get deals for a merchant by their unique code
// @route   POST /api/merchants/scan
// @access  Public
const getDealsByMerchantCode = async (req, res) => {
    const { merchantCode } = req.body;

    if (!merchantCode) {
        return res.status(400).json({ message: 'Merchant code is required' });
    }

    try {
        const merchant = await Merchant.findOne({ merchantCode });

        if (!merchant) {
            return res.status(404).json({ message: 'Merchant not found' });
        }

        const deals = await Deal.find({ merchant: merchant._id });
        res.json(deals);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update business hours for a specific location
// @route   PUT /api/merchants/locations/:locationId/hours
// @access  Private/Partner
const updateBusinessHours = async (req, res) => {
    const { openingHours } = req.body;
    const { locationId } = req.params;

    try {
        // Find the merchant associated with the logged-in partner
        const merchant = await Merchant.findOne({ user: req.user._id });
        if (!merchant) {
            return res.status(403).json({ message: 'User is not a partner or merchant not found' });
        }

        // Find the specific location within that merchant's locations array
        const location = merchant.locations.id(locationId);
        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        // Update the hours and save
        location.openingHours = openingHours;
        await merchant.save();

        res.json({ message: 'Business hours updated successfully', location });

    } catch (error) { 
        console.error('Update business hours error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getMerchants,
    getMerchantById,
    getMerchantDeals,
    addFavoriteMerchant,
    removeFavoriteMerchant,
    getDealsByMerchantCode,
    updateBusinessHours,
};
