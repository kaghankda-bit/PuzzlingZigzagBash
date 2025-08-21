const Activity = require('../models/Activity');
const mongoose = require('mongoose');

// @desc    Get user's activity history
// @route   GET /api/activity/history
// @access  Private
const getActivityHistory = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const activities = await Activity.find({ user: req.user._id })
            .populate('deal', 'title image')
            .populate('merchant', 'name')
            .sort({ redeemedAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Activity.countDocuments({ user: req.user._id });

        res.json({
            activities,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get user's savings summary
// @route   GET /api/activity/savings
// @access  Private
const getSavingsSummary = async (req, res) => {
    try {
        const savingsByCategory = await Activity.aggregate([
            { $match: { user: mongoose.Types.ObjectId(req.user._id) } },
            {
                $lookup: {
                    from: 'merchants',
                    localField: 'merchant',
                    foreignField: '_id',
                    as: 'merchantInfo'
                }
            },
            { $unwind: '$merchantInfo' },
            {
                $group: {
                    _id: '$merchantInfo.category',
                    totalSavings: { $sum: '$savings' }
                }
            },
            { $project: { _id: 0, category: '$_id', totalSavings: 1 } }
        ]);

        const totalSavings = savingsByCategory.reduce((acc, item) => acc + item.totalSavings, 0);

        res.json({ savingsByCategory, totalSavings });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getActivityHistory, getSavingsSummary };
