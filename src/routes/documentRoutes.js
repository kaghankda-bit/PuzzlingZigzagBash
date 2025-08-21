
const express = require('express');
const router = express.Router();
const {
    uploadPartnerDocument,
    getPartnerDocuments,
    getAllDocuments
} = require('../controllers/documentController');
const { protect, isPartnerAdmin, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/upload');
// Document routes
router.route('/')
    .get(protect, getPartnerDocuments)
    .post(protect, isPartnerAdmin, upload.single('document'), uploadPartnerDocument);

router.route('/:id')
    .get(protect, isAdmin, getAllDocuments)
    .put(protect, isPartnerAdmin, upload.single('document'), uploadPartnerDocument)
    .delete(protect, isPartnerAdmin, uploadPartnerDocument);

module.exports = router;

module.exports = router;
