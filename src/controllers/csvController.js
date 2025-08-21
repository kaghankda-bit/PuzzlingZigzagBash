
const csv = require('csv-parser');
const fs = require('fs');
const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const Partner = require('../models/Partner');
const { generateActivationCode } = require('./userController');

const importEmployeesCSV = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'CSV file is required' });
        }

        const partner = await Partner.findOne({ user: req.user.id });
        if (!partner) {
            return res.status(403).json({ message: 'User is not a partner' });
        }

        const results = [];
        const errors = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                for (let i = 0; i < results.length; i++) {
                    const row = results[i];
                    try {
                        // Validate required fields
                        if (!row.email || !row.name) {
                            errors.push({ row: i + 1, error: 'Email and name are required' });
                            continue;
                        }

                        // Check if user already exists
                        let user = await User.findOne({ email: row.email });
                        
                        if (!user) {
                            // Generate activation code
                            const activationCode = await generateActivationCode();
                            
                            // Create new user
                            user = new User({
                                name: row.name,
                                email: row.email,
                                membershipLevel: row.membershipLevel || 'Standard',
                                activationCode,
                                isActivated: false
                            });
                            await user.save();
                        }

                        // Add as team member
                        const teamMember = new TeamMember({
                            partner: partner._id,
                            user: user._id,
                            role: row.role || 'Employee',
                            department: row.department || 'General',
                            membershipLevel: row.membershipLevel || 'Standard',
                            addedBy: req.user.id
                        });

                        await teamMember.save();

                    } catch (error) {
                        errors.push({ row: i + 1, error: error.message });
                    }
                }

                // Clean up uploaded file
                fs.unlinkSync(req.file.path);

                res.json({
                    message: 'CSV import completed',
                    imported: results.length - errors.length,
                    errors
                });
            });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const exportEmployeesCSV = async (req, res) => {
    try {
        const partner = await Partner.findOne({ user: req.user.id });
        if (!partner) {
            return res.status(403).json({ message: 'User is not a partner' });
        }

        const teamMembers = await TeamMember.find({ partner: partner._id })
            .populate('user', 'name email membershipLevel')
            .lean();

        const csvData = teamMembers.map(member => ({
            name: member.user.name,
            email: member.user.email,
            role: member.role,
            department: member.department,
            membershipLevel: member.membershipLevel,
            joinedAt: member.createdAt
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
        
        const csvString = [
            'name,email,role,department,membershipLevel,joinedAt',
            ...csvData.map(row => Object.values(row).join(','))
        ].join('\n');

        res.send(csvString);

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    importEmployeesCSV,
    exportEmployeesCSV
};
