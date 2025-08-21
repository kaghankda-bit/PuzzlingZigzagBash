const User = require('../models/User');

// @desc    Get all saved locations for a user
// @route   GET /api/locations
// @access  Private
const getSavedLocations = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.json(user.savedLocations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add a new saved location
// @route   POST /api/locations
// @access  Private
const addSavedLocation = async (req, res) => {
    const { name, address, coordinates } = req.body;

    if (!name || !coordinates || !coordinates.length) {
        return res.status(400).json({ message: 'Name and coordinates are required' });
    }

    try {
        const user = await User.findById(req.user._id);

        const newLocation = {
            name,
            address,
            location: {
                type: 'Point',
                coordinates
            }
        };

        user.savedLocations.push(newLocation);
        await user.save();

        res.status(201).json(user.savedLocations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update a saved location
// @route   PUT /api/locations/:id
// @access  Private
const updateSavedLocation = async (req, res) => {
    const { name, address, coordinates } = req.body;

    try {
        const user = await User.findById(req.user._id);
        const location = user.savedLocations.id(req.params.id);

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        if (name) location.name = name;
        if (address) location.address = address;
        if (coordinates) location.location.coordinates = coordinates;

        await user.save();
        res.json(user.savedLocations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete a saved location
// @route   DELETE /api/locations/:id
// @access  Private
const deleteSavedLocation = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const location = user.savedLocations.id(req.params.id);

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        location.remove();
        await user.save();

        res.json({ message: 'Location removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getSavedLocations, addSavedLocation, updateSavedLocation, deleteSavedLocation };
