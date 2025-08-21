const User = require('../models/User');
const Partner = require('../models/Partner');
const Deal = require('../models/Deal');
const Redemption = require('../models/Redemption');
const Merchant = require('../models/Merchant');
const { customAlphabet } = require('nanoid');
const QRCode = require('qrcode');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'Member' });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    // This is a placeholder. You would need to implement the logic to find and delete a user.
    res.status(501).json({ message: 'Function not implemented.' });
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    // This is a placeholder. You would need to implement the logic to find a user by ID.
    res.status(501).json({ message: 'Function not implemented.' });
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    // This is a placeholder. You would need to implement the logic to update a user.
    res.status(501).json({ message: 'Function not implemented.' });
};

// @desc    Get all partners
// @route   GET /api/admin/partners
// @access  Private/Admin
const getPartners = async (req, res) => {
    try {
        const partners = await Partner.find({}).populate('userAccount', 'name email');
        res.json(partners);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve a partner application
// @route   PUT /api/admin/partners/:id/approve
// @access  Private/Admin
const approvePartner = async (req, res) => {
    try {
        const partner = await Partner.findById(req.params.id);

        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        if (partner.status === 'approved') {
            return res.status(400).json({ message: 'Partner is already approved' });
        }

        // Create a user account for the partner
        const temporaryPassword = Math.random().toString(36).slice(-8);
        const user = await User.create({
            name: partner.companyLegalName,
            email: partner.email,
            password: temporaryPassword,
            role: 'Partner',
            isVerified: true
        });

        // Generate a unique merchant code
        const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);
        const merchantCode = nanoid();

        // Generate a QR code for the merchant
        const qrCodeDataUrl = await QRCode.toDataURL(merchantCode);

        // Create a merchant profile with all required fields
        const merchant = await Merchant.create({
            user: user._id,
            name: partner.companyLegalName,
            logo: 'uploads/default_logo.png', // Placeholder logo
            description: 'Default merchant description.', // Placeholder description
            category: 'Services', // Default category
            merchantCode: merchantCode,
            qrCode: qrCodeDataUrl
        });

        // Update partner status and link user account
        partner.status = 'approved';
        partner.userAccount = user._id;
        await partner.save();

        console.log(`Partner ${partner.companyLegalName} approved. Temp password: ${temporaryPassword}`);

        // TODO: Send an email to the partner with their login credentials

        res.json({ message: 'Partner approved successfully', partner });

    } catch (error) {
        console.error('Approve partner error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const rejectPartner = async (req, res) => {
    try {
        const { rejectionReason } = req.body;
        const partner = await Partner.findById(req.params.id);
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        partner.status = 'rejected';
        // partner.rejectionReason = rejectionReason;
        // partner.isActive = false;
        await partner.save();

        res.json({ message: 'Partner rejected successfully', partner });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getDeals = async (req, res) => {
    try {
        const deals = await Deal.find({}).populate('partner', 'companyName');
        res.json(deals);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getRedemptions = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, userId, dealId } = req.query;
        const query = {};

        if (status) query.status = status;
        if (userId) query.user = userId;
        if (dealId) query.deal = dealId;

        const redemptions = await Redemption.find(query)
            .populate('user', 'name email membershipId')
            .populate('deal', 'title description')
            .populate('merchant', 'businessName')
            .sort({ redeemedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Redemption.countDocuments(query);

        res.json({
            redemptions,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
    getPartners,
    approvePartner,
    rejectPartner,
    getDeals,
    getRedemptions
};