
const Document = require('../models/Document');
const Partner = require('../models/Partner');
const multer = require('multer');
const path = require('path');

// Configure multer for document uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/documents/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadDocument = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|jpg|jpeg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only documents and images are allowed'));
        }
    }
});

// @desc    Upload document
// @route   POST /api/documents/upload
// @access  Private/Partner
const uploadPartnerDocument = async (req, res) => {
    try {
        const { documentType, description } = req.body;
        const partner = await Partner.findOne({ user: req.user._id });

        if (!partner) {
            return res.status(403).json({ message: 'Not authorized as partner' });
        }

        const document = new Document({
            partner: partner._id,
            documentType,
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            description,
            uploadedBy: req.user._id
        });

        await document.save();

        res.status(201).json({
            message: 'Document uploaded successfully',
            document
        });

    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get partner documents
// @route   GET /api/documents/partner
// @access  Private/Partner
const getPartnerDocuments = async (req, res) => {
    try {
        const partner = await Partner.findOne({ user: req.user._id });

        if (!partner) {
            return res.status(403).json({ message: 'Not authorized as partner' });
        }

        const documents = await Document.find({ partner: partner._id })
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(documents);

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all documents (Admin)
// @route   GET /api/documents/admin
// @access  Private/Admin
const getAllDocuments = async (req, res) => {
    try {
        const { partnerId, documentType } = req.query;
        let query = {};

        if (partnerId) query.partner = partnerId;
        if (documentType) query.documentType = documentType;

        const documents = await Document.find(query)
            .populate('partner', 'companyLegalName')
            .populate('uploadedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(documents);

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    uploadDocument,
    uploadPartnerDocument,
    getPartnerDocuments,
    getAllDocuments
};
