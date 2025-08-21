
const express = require('express');
const router = express.Router();
const { appleSignIn } = require('../controllers/appleAuthController');
const { protect } = require('../middlewares/authMiddleware');

// Apple Sign-In routes
router.post('/signin', appleSignIn);

module.exports = router;
