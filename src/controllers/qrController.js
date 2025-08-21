
const qrcode = require('qrcode');
const User = require('../models/User');
const Deal = require('../models/Deal');
const Merchant = require('../models/Merchant');
const Redemption = require('../models/Redemption');

// @desc    Generate QR code for member
// @route   GET /api/qr/member/:userId
// @access  Private
const generateMemberQR = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId || req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const qrData = {
            type: 'MEMBER',
            userId: user._id,
            membershipId: user.membershipId,
            timestamp: Date.now()
        };

        const qrCodeDataUrl = await qrcode.toDataURL(JSON.stringify(qrData));
        
        res.json({
            qrCode: qrCodeDataUrl,
            data: qrData
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Generate QR code for deal
// @route   GET /api/qr/deal/:dealId
// @access  Private
const generateDealQR = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.dealId).populate('merchant');
        if (!deal) {
            return res.status(404).json({ message: 'Deal not found' });
        }

        const qrData = {
            type: 'DEAL',
            dealId: deal._id,
            merchantId: deal.merchant._id,
            validUntil: deal.validUntil,
            timestamp: Date.now()
        };

        const qrCodeDataUrl = await qrcode.toDataURL(JSON.stringify(qrData));
        
        res.json({
            qrCode: qrCodeDataUrl,
            data: qrData,
            deal: {
                title: deal.title,
                discount: `${deal.discountValue}${deal.typeOfDiscount === 'Percentage' ? '%' : ''}`,
                merchant: deal.merchant.name
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Validate and process QR code scan
// @route   POST /api/qr/scan
// @access  Private
const scanQRCode = async (req, res) => {
    try {
        const { qrData, scannerType } = req.body; // scannerType: 'MEMBER' or 'MERCHANT'
        
        let parsedData;
        try {
            parsedData = JSON.parse(qrData);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid QR code format' });
        }

        const { type, timestamp } = parsedData;
        
        // Check if QR code is not too old (5 minutes)
        if (Date.now() - timestamp > 5 * 60 * 1000) {
            return res.status(400).json({ message: 'QR code has expired' });
        }

        if (type === 'MEMBER' && scannerType === 'MERCHANT') {
            // Merchant scanning member QR for redemption
            const { userId, membershipId } = parsedData;
            const user = await User.findById(userId);
            
            if (!user || user.membershipId !== membershipId) {
                return res.status(400).json({ message: 'Invalid member QR code' });
            }

            res.json({
                success: true,
                member: {
                    name: user.name,
                    membershipId: user.membershipId,
                    profilePicture: user.profilePicture
                }
            });

        } else if (type === 'DEAL' && scannerType === 'MEMBER') {
            // Member scanning deal QR for information
            const { dealId, merchantId, validUntil } = parsedData;
            
            if (new Date(validUntil) < new Date()) {
                return res.status(400).json({ message: 'Deal has expired' });
            }

            const deal = await Deal.findById(dealId).populate('merchant');
            
            if (!deal || deal.merchant._id.toString() !== merchantId) {
                return res.status(400).json({ message: 'Invalid deal QR code' });
            }

            res.json({
                success: true,
                deal: {
                    id: deal._id,
                    title: deal.title,
                    description: deal.description,
                    discount: `${deal.discountValue}${deal.typeOfDiscount === 'Percentage' ? '%' : ''}`,
                    merchant: deal.merchant.name,
                    validUntil: deal.validUntil
                }
            });

        } else {
            return res.status(400).json({ message: 'Invalid QR code type for scanner' });
        }

    } catch (error) {
        console.error('QR scan error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Process deal redemption via QR
// @route   POST /api/qr/redeem
// @access  Private
const redeemViaQR = async (req, res) => {
    try {
        const { memberQR, dealQR, originalAmount } = req.body;
        
        let memberData, dealData;
        try {
            memberData = JSON.parse(memberQR);
            dealData = JSON.parse(dealQR);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid QR code format' });
        }

        // Validate QR codes
        if (memberData.type !== 'MEMBER' || dealData.type !== 'DEAL') {
            return res.status(400).json({ message: 'Invalid QR code types' });
        }

        const user = await User.findById(memberData.userId);
        const deal = await Deal.findById(dealData.dealId).populate('merchant');

        if (!user || !deal) {
            return res.status(400).json({ message: 'Invalid QR codes' });
        }

        // Check if already redeemed recently
        const existingRedemption = await Redemption.findOne({
            user: user._id,
            deal: deal._id,
            redeemedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (existingRedemption) {
            return res.status(400).json({ message: 'Deal already redeemed recently' });
        }

        // Calculate savings
        let savings = 0;
        if (deal.typeOfDiscount === 'Percentage') {
            savings = (deal.discountValue / 100) * originalAmount;
        } else {
            savings = deal.discountValue;
        }

        // Create redemption
        const redemption = new Redemption({
            user: user._id,
            deal: deal._id,
            merchant: deal.merchant._id,
            savings: savings,
            originalAmount: originalAmount,
            verificationMethod: 'QR_CODE'
        });

        await redemption.save();

        // Update deal stats
        deal.totalRedemptions = (deal.totalRedemptions || 0) + 1;
        await deal.save();

        res.json({
            success: true,
            message: 'Deal redeemed successfully!',
            redemption: {
                savings,
                deal: deal.title,
                member: user.name
            }
        });

    } catch (error) {
        console.error('QR redemption error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    generateMemberQR,
    generateDealQR,
    scanQRCode,
    redeemViaQR
};
