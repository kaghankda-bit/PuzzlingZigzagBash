
const express = require('express');
const router = express.Router();
const { importEmployeesCSV, exportEmployeesCSV } = require('../controllers/csvController');
const { protect, isPartnerAdmin } = require('../middlewares/authMiddleware');
const multer = require('multer');

const csvUpload = multer({
    dest: 'uploads/csv/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

router.post('/import-employees', protect, isPartnerAdmin, csvUpload.single('csvFile'), importEmployeesCSV);
router.get('/export-employees', protect, isPartnerAdmin, exportEmployeesCSV);

module.exports = router;
