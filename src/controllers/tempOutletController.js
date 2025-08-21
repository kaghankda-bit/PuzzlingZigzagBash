const Outlet = require('../models/Outlet');
const Partner = require('../models/Partner');

// @desc    Get partner from user (middleware)
// @access  Private/Partner
const getPartnerFromUser = async (req, res, next) => {
    try {
        const partner = await Partner.findOne({ user: req.user._id });
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found for this user' });
        }
        req.partner = partner;
        next();
    } catch (error) {
        console.error('Error getting partner from user:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new outlet
// @route   POST /api/outlets
// @access  Private/Partner
const createOutlet = async (req, res) => {
    try {
        const { name, address, location, contactInfo, businessHours } = req.body;
        
        const outlet = new Outlet({
            partner: req.partner._id,
            name,
            address,
            location,
            contactInfo,
            businessHours
        });
        
        const createdOutlet = await outlet.save();
        res.status(201).json(createdOutlet);
    } catch (error) {
        console.error('Error creating outlet:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all outlets for the logged in partner
// @route   GET /api/outlets
// @access  Private/Partner
const getMyOutlets = async (req, res) => {
    try {
        const outlets = await Outlet.find({ partner: req.partner._id });
        res.json(outlets);
    } catch (error) {
        console.error('Error getting outlets:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get a single outlet by ID
// @route   GET /api/outlets/:id
// @access  Private/Partner
const getOutletById = async (req, res) => {
    try {
        const outlet = await Outlet.findById(req.params.id);
        
        if (!outlet) {
            return res.status(404).json({ message: 'Outlet not found' });
        }
        
        // Ensure the outlet belongs to the partner
        if (outlet.partner.toString() !== req.partner._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to access this outlet' });
        }
        
        res.json(outlet);
    } catch (error) {
        console.error('Error getting outlet:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update an outlet
// @route   PUT /api/outlets/:id
// @access  Private/Partner
const updateOutlet = async (req, res) => {
    try {
        const { name, address, location, contactInfo, businessHours } = req.body;
        
        const outlet = await Outlet.findById(req.params.id);
        
        if (!outlet) {
            return res.status(404).json({ message: 'Outlet not found' });
        }
        
        // Ensure the outlet belongs to the partner
        if (outlet.partner.toString() !== req.partner._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this outlet' });
        }
        
        outlet.name = name || outlet.name;
        outlet.address = address || outlet.address;
        outlet.location = location || outlet.location;
        outlet.contactInfo = contactInfo || outlet.contactInfo;
        outlet.businessHours = businessHours || outlet.businessHours;
        
        const updatedOutlet = await outlet.save();
        res.json(updatedOutlet);
    } catch (error) {
        console.error('Error updating outlet:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete an outlet
// @route   DELETE /api/outlets/:id
// @access  Private/Partner
const deleteOutlet = async (req, res) => {
    try {
        const outlet = await Outlet.findById(req.params.id);
        
        if (!outlet) {
            return res.status(404).json({ message: 'Outlet not found' });
        }
        
        // Ensure the outlet belongs to the partner
        if (outlet.partner.toString() !== req.partner._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this outlet' });
        }
        
        await outlet.remove();
        res.json({ message: 'Outlet removed' });
    } catch (error) {
        console.error('Error deleting outlet:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getPartnerFromUser,
    createOutlet,
    getMyOutlets,
    getOutletById,
    updateOutlet,
    deleteOutlet
};
