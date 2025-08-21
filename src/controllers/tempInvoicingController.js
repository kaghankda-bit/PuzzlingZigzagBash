const { createInvoice } = require('../services/eRacuniService');
const Partner = require('../models/Partner');
// Note: Order model doesn't exist in your project, using User as fallback
const User = require('../models/User');

// @desc    Generate an e-Računi invoice for a partner's subscription or order
// @route   POST /api/invoicing/generate
// @access  Private/Admin
const generateEInvoice = async (req, res) => {
    const { partnerId, orderId } = req.body;

    try {
        let invoiceData = {};

        if (partnerId) {
            const partner = await Partner.findById(partnerId);
            if (!partner) {
                return res.status(404).json({ message: 'Partner not found.' });
            }
            // TODO: Construct invoice data from partner's subscription details
            // This is a placeholder and will need to be adapted to your specific logic
            invoiceData = {
                partnerCode: partner.companyRegistrationNumber, // Assuming this field exists
                items: [
                    {
                        description: 'Monthly Subscription Fee',
                        quantity: 1,
                        price: 29.99, // Example price
                        vat: 25 // Example VAT rate
                    }
                ]
            };
        } else if (orderId) {
            // Since Order model doesn't exist, we'll use a different approach
            return res.status(400).json({ message: 'Order invoicing not yet implemented. Please use partnerId instead.' });
        }

        const apiResponse = await createInvoice(invoiceData);

        res.json({ message: 'Invoice created successfully in e-Računi.', data: apiResponse });

    } catch (error) {
        console.error('Error generating e-invoice:', error);
        res.status(500).json({ message: 'Failed to generate e-invoice.', error: error.message });
    }
};

module.exports = { generateEInvoice };
