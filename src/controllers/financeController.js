
const axios = require('axios');
const User = require('../models/User');
const Partner = require('../models/Partner');
const AuditLog = require('../models/AuditLog');

// e-Računi API Integration
const generateInvoice = async (req, res) => {
    try {
        const { partnerId, month, year } = req.body;
        
        const partner = await Partner.findById(partnerId);
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        // Generate invoice data
        const invoiceData = {
            partner: partner.businessName,
            oib: partner.oib,
            month,
            year,
            amount: calculateMonthlyAmount(partner),
            dueDate: new Date(year, month, 15), // 15th of next month
            items: [
                {
                    description: 'Privilege Platform Monthly Subscription',
                    quantity: 1,
                    price: calculateMonthlyAmount(partner),
                    total: calculateMonthlyAmount(partner)
                }
            ]
        };

        // Call e-Računi API
        const response = await axios.post(process.env.ERACUNI_API_URL + '/invoices', invoiceData, {
            headers: {
                'Authorization': `Bearer ${process.env.ERACUNI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Log audit trail
        await AuditLog.create({
            action: 'INVOICE_GENERATED',
            userId: req.user._id,
            targetId: partnerId,
            details: { invoiceId: response.data.invoiceId, amount: invoiceData.amount }
        });

        res.json({
            message: 'Invoice generated successfully',
            invoice: response.data
        });

    } catch (error) {
        console.error('Generate invoice error:', error);
        res.status(500).json({ message: 'Failed to generate invoice' });
    }
};

const generateQuote = async (req, res) => {
    try {
        const { partnerId, services } = req.body;
        
        const partner = await Partner.findById(partnerId);
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }

        let total = 0;
        const quoteItems = services.map(service => {
            const price = getServicePrice(service.type);
            const itemTotal = price * service.quantity;
            total += itemTotal;
            
            return {
                service: service.type,
                description: service.description,
                quantity: service.quantity,
                price,
                total: itemTotal
            };
        });

        const quoteData = {
            quoteNumber: generateQuoteNumber(),
            partner: partner.businessName,
            oib: partner.oib,
            items: quoteItems,
            subtotal: total,
            tax: total * 0.25, // 25% PDV
            total: total * 1.25,
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        };

        // Call e-Računi API for quote
        const response = await axios.post(process.env.ERACUNI_API_URL + '/quotes', quoteData, {
            headers: {
                'Authorization': `Bearer ${process.env.ERACUNI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        await AuditLog.create({
            action: 'QUOTE_GENERATED',
            userId: req.user._id,
            targetId: partnerId,
            details: { quoteId: response.data.quoteId, total: quoteData.total }
        });

        res.json({
            message: 'Quote generated successfully',
            quote: response.data
        });

    } catch (error) {
        console.error('Generate quote error:', error);
        res.status(500).json({ message: 'Failed to generate quote' });
    }
};

const getInvoices = async (req, res) => {
    try {
        const { partnerId, status, month, year } = req.query;
        
        const params = {};
        if (partnerId) params.partnerId = partnerId;
        if (status) params.status = status;
        if (month && year) {
            params.month = month;
            params.year = year;
        }

        const response = await axios.get(process.env.ERACUNI_API_URL + '/invoices', {
            params,
            headers: {
                'Authorization': `Bearer ${process.env.ERACUNI_API_KEY}`
            }
        });

        res.json(response.data);

    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ message: 'Failed to retrieve invoices' });
    }
};

// Helper functions
const calculateMonthlyAmount = (partner) => {
    // Base subscription fee
    let amount = 299; // Base monthly fee in HRK
    
    // Additional fees based on team size
    if (partner.teamMembers && partner.teamMembers.length > 5) {
        amount += (partner.teamMembers.length - 5) * 50;
    }
    
    return amount;
};

const getServicePrice = (serviceType) => {
    const prices = {
        'basic_subscription': 299,
        'premium_subscription': 599,
        'team_member': 50,
        'advanced_analytics': 199,
        'custom_integration': 999
    };
    
    return prices[serviceType] || 0;
};

const generateQuoteNumber = () => {
    const prefix = 'QUO';
    const timestamp = Date.now();
    return `${prefix}${timestamp}`;
};

module.exports = {
    generateInvoice,
    generateQuote,
    getInvoices
};
