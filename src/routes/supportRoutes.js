
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { 
    createTicket, 
    getTickets, 
    updateTicket, 
    addResponse 
} = require('../controllers/supportController');

router.use(protect);

router.post('/', createTicket);
router.get('/', getTickets);
router.put('/:ticketId', updateTicket);
router.post('/:ticketId/responses', addResponse);

module.exports = router;
