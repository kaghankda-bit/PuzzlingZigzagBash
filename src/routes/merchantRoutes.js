const express = require('express');
const router = express.Router();
const {
    getMerchants,
    getMerchantById,
    getMerchantDeals,
    addFavoriteMerchant,
    removeFavoriteMerchant,
    getDealsByMerchantCode,
    updateBusinessHours,
} = require('../controllers/merchantController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', getMerchants);
router.get('/:id', getMerchantById);
router.get('/:id/deals', getMerchantDeals);

// Scan merchant QR code
router.post('/scan', getDealsByMerchantCode);

// Update business hours for a specific location (for partners)
router.put('/locations/:locationId/hours', protect, updateBusinessHours);

// Private routes for favorites
router.post('/:id/favorite', protect, addFavoriteMerchant);
router.delete('/:id/favorite', protect, removeFavoriteMerchant);

module.exports = router;
