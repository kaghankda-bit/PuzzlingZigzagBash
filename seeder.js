
require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
const sequelize = require('./src/config/sequelize');

// Import all data files
const merchants = require('./data/merchants');
const dealsData = require('./data/deals');
const subscriptionPlans = require('./data/subscriptionPlans');
const users = require('./data/users');
const partners = require('./data/partners');
const outlets = require('./data/outlets');
const products = require('./data/products');
const promoCodes = require('./data/promoCodes');

// Import all Sequelize models
const User = require('./src/models/sequelize/User');
const Partner = require('./src/models/sequelize/Partner');
const Deal = require('./src/models/sequelize/Deal');
const Merchant = require('./src/models/sequelize/Merchant');

const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const importData = async () => {
    try {
        // Test PostgreSQL connection with SSL fix
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Connected for Seeding...');

        // Sync database (create tables if not exist)
        await sequelize.sync({ force: true }); // force: true will drop and recreate tables
        console.log('✅ Database tables created/synced');

        // Clear existing data
        console.log('🧹 Clearing old data...');
        await Deal.destroy({ where: {}, force: true });
        await Merchant.destroy({ where: {}, force: true });
        await Partner.destroy({ where: {}, force: true });
        await User.destroy({ where: {}, force: true });
        console.log('✅ Old data cleared.');

        // 1. Insert Users first (with hashed passwords)
        console.log('👥 Importing users...');
        const usersToCreate = await Promise.all(users.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            return {
                ...user,
                password: hashedPassword,
                dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
                membershipId: `HR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                isVerified: true,
                membershipLevel: 'Standard',
                totalSavings: 0,
                points: 100
            };
        }));
        const createdUsers = await User.bulkCreate(usersToCreate);
        console.log(`✅ ${createdUsers.length} Users Imported!`);

        // 2. Insert Partners
        console.log('🤝 Importing partners...');
        const partnersToCreate = partners.map(partner => ({
            ...partner,
            status: 'approved',
            isApproved: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        const createdPartners = await Partner.bulkCreate(partnersToCreate);
        console.log(`✅ ${createdPartners.length} Partners Imported!`);

        // 3. Insert Merchants with QR codes
        console.log('🏪 Importing merchants...');
        const merchantsWithCodes = await Promise.all(merchants.map(async (merchant, index) => {
            const merchantCode = uuidv4();
            const qrCode = await qrcode.toDataURL(merchantCode);
            
            // Assign partner to merchant
            const partnerId = createdPartners[index % createdPartners.length]?.id;
            
            return {
                name: merchant.name,
                email: `${merchant.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
                phone: `+385-${Math.floor(10000000 + Math.random() * 90000000)}`,
                address: merchant.locations?.[0]?.address || 'Zagreb, Croatia',
                category: merchant.category,
                description: merchant.description,
                logo: merchant.logo,
                images: [merchant.coverImage],
                location: merchant.locations?.[0]?.location || { 
                    type: 'Point', 
                    coordinates: [15.9819, 45.8150] // Zagreb coordinates
                },
                businessHours: {
                    monday: '08:00-20:00',
                    tuesday: '08:00-20:00',
                    wednesday: '08:00-20:00',
                    thursday: '08:00-20:00',
                    friday: '08:00-22:00',
                    saturday: '09:00-22:00',
                    sunday: '10:00-18:00'
                },
                qrCode,
                isActive: true,
                rating: parseFloat((4.0 + Math.random()).toFixed(1)),
                totalReviews: Math.floor(Math.random() * 100) + 10,
                partnerId
            };
        }));
        const createdMerchants = await Merchant.bulkCreate(merchantsWithCodes);
        console.log(`✅ ${createdMerchants.length} Merchants Imported!`);

        // 4. Insert Deals linked to merchants and partners
        console.log('🎯 Importing deals...');
        const dealsToCreate = dealsData.map((deal, index) => {
            const merchant = createdMerchants[index % createdMerchants.length];
            const partner = createdPartners[index % createdPartners.length];
            
            return {
                ...deal,
                merchantId: merchant.id,
                partnerId: partner.id,
                validFrom: new Date(),
                validUntil: new Date(deal.validUntil),
                isActive: true,
                status: 'active',
                redemptionCount: 0,
                maxRedemptions: 1000,
                locations: [{
                    latitude: 45.8150 + (Math.random() - 0.5) * 0.1,
                    longitude: 15.9819 + (Math.random() - 0.5) * 0.1,
                    radius: 5
                }]
            };
        });
        const createdDeals = await Deal.bulkCreate(dealsToCreate);
        console.log(`✅ ${createdDeals.length} Deals Imported and linked!`);

        // 5. Create sample data for testing
        console.log('🎲 Creating sample test data...');
        
        // Create a test user for API testing
        const testUser = await User.create({
            name: 'Test User',
            email: 'test@example.com',
            password: await bcrypt.hash('123456', 10),
            phone: '+385-123-456-789',
            countryCode: '+385',
            membershipId: 'HR' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            isVerified: true,
            membershipLevel: 'VIP',
            totalSavings: 250.50,
            points: 500,
            gender: 'male',
            dateOfBirth: new Date('1990-01-01')
        });
        
        // Create admin user
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@app.com',
            password: await bcrypt.hash('admin123', 10),
            phone: '+385-999-888-777',
            countryCode: '+385',
            membershipId: 'HRADMIN',
            isVerified: true,
            isAdmin: true,
            membershipLevel: 'VIP',
            totalSavings: 0,
            points: 1000
        });

        console.log('✅ Sample test data created!');

        // Summary
        console.log('\n🎉 DATA IMPORT SUCCESS!');
        console.log('====================================');
        console.log(`👥 Users: ${createdUsers.length + 2} (including test & admin)`);
        console.log(`🤝 Partners: ${createdPartners.length}`);
        console.log(`🏪 Merchants: ${createdMerchants.length}`);
        console.log(`🎯 Deals: ${createdDeals.length}`);
        console.log('====================================');
        console.log('🔐 Test Credentials:');
        console.log('Email: test@example.com | Password: 123456');
        console.log('Admin: admin@app.com | Password: admin123');
        console.log('====================================');

        await sequelize.close();
        console.log('✅ PostgreSQL Disconnected.');
        process.exit(0);
    } catch (error) {
        console.error(`❌ Error during import: ${error.message}`);
        console.error(error.stack);
        await sequelize.close();
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await sequelize.authenticate();
        console.log('🔥 PostgreSQL Connected for Data Destruction...');

        // Drop all tables in correct order (reverse of creation)
        await Deal.destroy({ where: {}, force: true });
        await Merchant.destroy({ where: {}, force: true });
        await Partner.destroy({ where: {}, force: true });
        await User.destroy({ where: {}, force: true });

        console.log('💥 All Data Destroyed!');
        await sequelize.close();
        console.log('✅ PostgreSQL Disconnected.');
        process.exit(0);
    } catch (error) {
        console.error(`❌ Error during destruction: ${error.message}`);
        await sequelize.close();
        process.exit(1);
    }
};

// Handle command line arguments
if (process.argv[2] === '-d') {
    console.log('🔥 Starting data destruction...');
    destroyData();
} else {
    console.log('🚀 Starting data import...');
    importData();
}
