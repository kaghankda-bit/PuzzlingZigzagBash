const Partner = require('../models/Partner');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const Deal = require('../models/Deal');
const sendEmail = require('../utils/email');
const bcrypt = require('bcryptjs');
const { customAlphabet } = require('nanoid');

// @desc    Add team member
// @route   POST /api/partners/team-members
// @access  Private/Partner
// @desc    Import employees from CSV
// @route   POST /api/partners/import-employees
// @access  Private/Partner
const importEmployeesCSV = async (req, res) => {
    try {
        const partner = await Partner.findOne({ user: req.user._id });
        if (!partner) {
            return res.status(403).json({ message: 'Not authorized as partner' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'CSV file required' });
        }

        const csv = require('csv-parser');
        const fs = require('fs');
        const results = [];
        const errors = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    try {
                        const { name, email, role, membershipLevel = 'Standard' } = row;

                        if (!name || !email || !role) {
                            errors.push(`Row ${i + 1}: Missing required fields`);
                            continue;
                        }

                        // Check if user exists
                        let user = await User.findOne({ email });
                        const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
                        const temporaryPassword = nanoid();

                        if (!user) {
                            user = new User({
                                name,
                                email,
                                password: temporaryPassword,
                                role: 'TeamMember',
                                isVerified: true,
                                membershipLevel
                            });
                            await user.save();
                        }

                        // Create team member
                        const teamMember = new TeamMember({
                            user: user._id,
                            partner: partner._id,
                            role,
                            addedBy: req.user._id,
                            status: 'active',
                            membershipLevel
                        });

                        await teamMember.save();

                        // Send email notification
                        await sendEmail({
                            email: user.email,
                            subject: `Welcome to ${partner.companyLegalName}`,
                            message: `
                                Hello ${name},

                                You have been added to ${partner.companyLegalName} with ${membershipLevel} membership.
                                Role: ${role}

                                ${!user.password ? `Your temporary password is: ${temporaryPassword}` : ''}

                                Please log in to access your benefits.

                                Best regards,
                                ${partner.companyLegalName} Team
                            `
                        });

                    } catch (error) {
                        errors.push(`Row ${i + 1}: ${error.message}`);
                    }
                }

                // Clean up uploaded file
                fs.unlinkSync(req.file.path);

                res.json({
                    message: 'Import completed',
                    processed: results.length,
                    errors: errors.length,
                    errorDetails: errors
                });
            });

    } catch (error) {
        console.error('CSV import error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const addTeamMember = async (req, res) => {
    try {
        const { name, email, role, permissions } = req.body;

        const partner = await Partner.findOne({ user: req.user._id });
        if (!partner) {
            return res.status(403).json({ message: 'Not authorized as partner' });
        }

        // Check if user already exists
        let user = await User.findOne({ email });
        const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
        const temporaryPassword = nanoid();

        if (!user) {
            // Create new user account
            user = new User({
                name,
                email,
                password: temporaryPassword,
                role: 'TeamMember',
                isVerified: true
            });
            await user.save();
        }

        // Create team member record
        const teamMember = new TeamMember({
            user: user._id,
            partner: partner._id,
            role,
            permissions: permissions || [],
            addedBy: req.user._id,
            status: 'active'
        });

        await teamMember.save();

        // Send invitation email
        await sendEmail({
            email: user.email,
            subject: `You've been invited to join ${partner.name}`,
            message: `
                Hello ${name},

                You have been invited to join ${partner.name} as a ${role}.

                ${!user.password ? `Your temporary password is: ${temporaryPassword}` : ''}

                Please log in to the partner portal to access your dashboard.

                Best regards,
                ${partner.name} Team
            `
        });

        res.status(201).json({
            message: 'Team member added successfully',
            teamMember: {
                ...teamMember.toObject(),
                user: { name: user.name, email: user.email }
            }
        });

    } catch (error) {
        console.error('Add team member error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all team members
// @route   GET /api/partners/team-members
// @access  Private/Partner
const getTeamMembers = async (req, res) => {
    try {
        const partner = await Partner.findOne({ user: req.user._id });
        if (!partner) {
            return res.status(403).json({ message: 'Not authorized as partner' });
        }

        const teamMembers = await TeamMember.find({ partner: partner._id })
            .populate('user', 'name email profilePicture')
            .populate('addedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(teamMembers);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update team member role/permissions
// @route   PUT /api/partners/team-members/:id
// @access  Private/Partner
const updateTeamMember = async (req, res) => {
    try {
        const { role, permissions, status } = req.body;

        const partner = await Partner.findOne({ user: req.user._id });
        if (!partner) {
            return res.status(403).json({ message: 'Not authorized as partner' });
        }

        const teamMember = await TeamMember.findById(req.params.id);
        if (!teamMember || teamMember.partner.toString() !== partner._id.toString()) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        if (role) teamMember.role = role;
        if (permissions) teamMember.permissions = permissions;
        if (status) teamMember.status = status;

        await teamMember.save();

        res.json({ message: 'Team member updated successfully', teamMember });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Remove team member
// @route   DELETE /api/partners/team-members/:id
// @access  Private/Partner
const removeTeamMember = async (req, res) => {
    try {
        const partner = await Partner.findOne({ user: req.user._id });
        if (!partner) {
            return res.status(403).json({ message: 'Not authorized as partner' });
        }

        const teamMember = await TeamMember.findById(req.params.id);
        if (!teamMember || teamMember.partner.toString() !== partner._id.toString()) {
            return res.status(404).json({ message: 'Team member not found' });
        }

        await teamMember.remove();
        res.json({ message: 'Team member removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Register a new partner
// @route   POST /api/partners/register
// @access  Public
const registerPartner = async (req, res) => {
    const {
        usageType,
        oib,
        companyLegalName,
        location,
        representativeName,
        representativeLastName,
        email,
        phoneNumber,
        referralCode
    } = req.body;

    try {
        // Check if a partner with this email already exists
        // Check if a user with this email already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'A user with this email already exists.' });
        }

        // Check if a partner with this company name already exists
        const existingPartner = await Partner.findOne({ companyLegalName });
        if (existingPartner) {
            return res.status(400).json({ message: 'A partner with this company name already exists.' });
        }

        // Create a new user for the partner
        const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
        const temporaryPassword = nanoid();
        user = new User({
            name: `${representativeName} ${representativeLastName}`,
            email,
            password: temporaryPassword,
            role: 'Partner',
            isVerified: true // Or false, pending email verification
        });
        await user.save();

        // Handle file uploads
        const files = req.files;
        const businessLicense = files.businessLicense ? files.businessLicense[0].path : null;
        const ownerIdFront = files.ownerIdFront ? files.ownerIdFront[0].path : null;
        const ownerIdBack = files.ownerIdBack ? files.ownerIdBack[0].path : null;

        const newPartner = new Partner({
            usageType,
            oib,
            companyLegalName,
            location,
            representativeName,
            representativeLastName,
            email,
            phoneNumber,
            referralCode,
            businessLicense,
            ownerIdFront,
            ownerIdBack,
            userAccount: user._id
        });

        await newPartner.save();

        // Optionally, send a welcome email with the temporary password
        await sendEmail({
            email: user.email,
            subject: `Welcome to Our Platform, ${companyLegalName}! `,
            message: `
                Hello ${representativeName},

                Your partner account for ${companyLegalName} has been created.
                Your temporary password is: ${temporaryPassword}

                Please log in to access your dashboard.

                Best regards,
                The Team
            `
        });

        res.status(201).json({
            message: 'Partner application submitted successfully. We will review your application and get back to you shortly.',
            partner: newPartner
        });

    } catch (error) {
        console.error('Partner registration error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get partner dashboard data
// @route   GET /api/partners/dashboard
// @access  Private/Partner
const getPartnerDashboard = async (req, res) => {
    try {
        // Assuming the logged-in user is a partner and their user ID is linked to a merchant
        const partner = await Partner.findOne({ userAccount: req.user._id }).populate('userAccount', 'name email');

        if (!partner) {
            return res.status(404).json({ message: 'Partner profile not found.' });
        }

        // Find the merchant associated with this partner
        const merchant = await Merchant.findOne({ partner: partner._id });

        let deals = [];
        if (merchant) {
            deals = await Deal.find({ merchant: merchant._id });
        }

        const dashboardData = {
            partner,
            merchant,
            deals,
            // Add more aggregated data as needed
        };

        res.json(dashboardData);

    } catch (error) {
        console.error('Get partner dashboard error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};



const getPartnerProfile = async (req, res) => {
    try {
        const partner = await Partner.findOne({ user: req.user.id });
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }
        res.json(partner);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updatePartnerProfile = async (req, res) => {
    try {
        const partner = await Partner.findOneAndUpdate({ user: req.user.id }, req.body, { new: true });
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }
        res.json(partner);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addTeamMember,
    getTeamMembers,
    updateTeamMember,
    removeTeamMember,
    registerPartner,
    getPartnerDashboard,
    getPartnerProfile,
    updatePartnerProfile,
    importEmployeesCSV
};