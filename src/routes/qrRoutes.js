
const express = require('express');
const router = express.Router();
const {
    generateMemberQR,
    generateDealQR,
    scanQRCode,
    redeemViaQR
} = require('../controllers/qrController');
const { protect } = require('../middlewares/authMiddleware');

// Handle requests with userId
router.get('/member/:userId', protect, generateMemberQR);
// Handle requests without userId
router.get('/member', protect, generateMemberQR);
router.get('/deal/:dealId', protect, generateDealQR);
router.post('/scan', protect, scanQRCode);
router.post('/redeem', protect, redeemViaQR);

module.exports = router;
