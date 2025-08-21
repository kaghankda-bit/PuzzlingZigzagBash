const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const {
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
    getPartners,
    approvePartner,
    getDeals,
    getRedemptions
} = require('../controllers/adminController');

// User management routes
router.route('/users').get(protect, isAdmin, getUsers);
router.route('/users/:id')
    .delete(protect, isAdmin, deleteUser)
    .get(protect, isAdmin, getUserById)
    .put(protect, isAdmin, updateUser);

// Partner management routes
router.route('/partners').get(protect, isAdmin, getPartners);
router.route('/partners/:id/approve').put(protect, isAdmin, approvePartner);

// Other admin routes
router.get('/deals', protect, isAdmin, getDeals);
router.get('/redemptions', protect, isAdmin, getRedemptions);

module.exports = router;