// Disable SSL verification for development (Replit environment)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require('express');
const { connectDB } = require('./config/db');
const sequelize = require('./config/sequelize');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');

// Load env vars
dotenv.config();

// Passport config
require('./config/passport')(passport);

// Connect to PostgreSQL database
connectDB();

// Sync Sequelize models
sequelize.sync({ force: false })
    .then(() => console.log('Database synced'))
    .catch(err => console.error('Error syncing database:', err));

// Initialize Firebase Admin SDK
require('./config/firebase');

const app = express();

app.use(express.json());
app.use(cors());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
const userRoutes = require('./routes/userRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const dealRoutes = require('./routes/dealRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const qrRoutes = require('./routes/qrRoutes');
const stripeRoutes = require('./routes/tempStripeRoutes');
const appleAuthRoutes = require('./routes/appleAuthRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const documentRoutes = require('./routes/documentRoutes');
const csvRoutes = require('./routes/csvRoutes');
const auditRoutes = require('./routes/tempAuditRoutes');
const supportRoutes = require('./routes/tempSupportRoutes');
const consentRoutes = require('./routes/tempConsentRoutes');
const outletRoutes = require('./routes/outletRoutes');
const adminRoutes = require('./routes/adminRoutes');
const invoicingRoutes = require('./routes/tempInvoicingRoutes');
const authRoutes = require('./routes/authRoutes');

app.use('/api/users', userRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/apple-auth', appleAuthRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/csv', csvRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/invoicing', invoicingRoutes);

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on 0.0.0.0:${PORT}`);
});