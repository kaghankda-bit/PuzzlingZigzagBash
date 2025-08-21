const express = require('express');
const router = express.Router();
const { getDeals, getDealById, redeemDeal, rateDeal, addFavoriteDeal, removeFavoriteDeal, createDeal, updateDeal, deleteDeal, getPartnerDeals, getDealStats, toggleDealStatus } = require('../controllers/dealController');
const { protect, isPartnerAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');

// Public routes
router.route('/').get(getDeals);
router.route('/:id').get(getDealById);

// Member routes
router.post('/:id/redeem', protect, redeemDeal);
router.post('/:id/rate', protect, rateDeal);
router.route('/:id/favorite')
    .post(protect, addFavoriteDeal)
    .delete(protect, removeFavoriteDeal);

// Partner routes
router.route('/partner').get(protect, isPartnerAdmin, getPartnerDeals);
router.route('/')
    .post(protect, isPartnerAdmin, upload.single('image'), createDeal);

router.route('/:id')
    .put(protect, isPartnerAdmin, upload.single('image'), updateDeal)
    .delete(protect, isPartnerAdmin, deleteDeal);


router.get('/:id/stats', protect, getDealStats);
router.patch('/:id/toggle-status', protect, toggleDealStatus);


module.exports = router;