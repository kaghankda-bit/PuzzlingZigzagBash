const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getSavedLocations, addSavedLocation, updateSavedLocation, deleteSavedLocation } = require('../controllers/locationController');

router.route('/')
    .get(protect, getSavedLocations)
    .post(protect, addSavedLocation);

router.route('/:id')
    .put(protect, updateSavedLocation)
    .delete(protect, deleteSavedLocation);

module.exports = router;
