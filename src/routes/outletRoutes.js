const express = require('express');
const router = express.Router();
const {
    getPartnerFromUser,
    createOutlet,
    getMyOutlets,
    getOutletById,
    updateOutlet,
    deleteOutlet
} = require('../controllers/tempOutletController');
const { protect } = require('../middlewares/authMiddleware');

// All routes in this file are protected and for partners
// The getPartnerFromUser middleware will ensure only partners can access these routes
router.use(protect, getPartnerFromUser);

router.route('/')
    .post(createOutlet)
    .get(getMyOutlets);

router.route('/:id')
    .get(getOutletById)
    .put(updateOutlet)
    .delete(deleteOutlet);

module.exports = router;
