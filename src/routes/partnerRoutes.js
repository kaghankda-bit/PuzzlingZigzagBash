const express = require('express');
const router = express.Router();
const {
    registerPartner,
    getPartnerDashboard,
    getPartnerProfile,
    updatePartnerProfile,
    addTeamMember,
    getTeamMembers,
    updateTeamMember,
    removeTeamMember
} = require('../controllers/partnerController');
const upload = require('../middlewares/upload');
const { protect, isPartnerAdmin } = require('../middlewares/authMiddleware');
const { audit } = require('../middlewares/auditMiddleware');

// @route   POST /api/partners/register
// @desc    Register a new partner
// @access  Public
router.post('/register',
    upload.fields([
        { name: 'businessLicense', maxCount: 1 },
        { name: 'ownerIdFront', maxCount: 1 },
        { name: 'ownerIdBack', maxCount: 1 }
    ]),
    registerPartner
);

// @route   GET /api/partners/dashboard
// @desc    Get partner dashboard data
// @access  Private/Partner
router.get('/dashboard', protect, getPartnerDashboard);

router.route('/profile').get(protect, getPartnerProfile).put(protect, audit('UPDATE', 'PARTNER'), updatePartnerProfile);

// Team member management routes
router.route('/team-members')
    .get(protect, isPartnerAdmin, getTeamMembers)
    .post(protect, isPartnerAdmin, audit('CREATE', 'USER'), addTeamMember);

router.route('/team-members/:id')
    .put(protect, isPartnerAdmin, audit('UPDATE', 'USER'), updateTeamMember)
    .delete(protect, isPartnerAdmin, audit('DELETE', 'USER'), removeTeamMember);

module.exports = router;