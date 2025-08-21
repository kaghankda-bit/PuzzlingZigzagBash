
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true
    },
    gender: {
        type: DataTypes.ENUM('male', 'female', 'other'),
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    },
    zipCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    appleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    authProvider: {
        type: DataTypes.ENUM('local', 'google', 'apple'),
        defaultValue: 'local'
    },
    fcmToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    membershipLevel: {
        type: DataTypes.ENUM('Standard', 'VIP'),
        defaultValue: 'Standard'
    },
    activationCode: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otpExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    referralCode: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    referredBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    subscriptionStatus: {
        type: DataTypes.ENUM('none', 'active', 'canceled', 'past_due'),
        defaultValue: 'none'
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    deactivatedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    membershipId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    }
}, {
    timestamps: true,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
            if (!user.referralCode) {
                user.referralCode = Math.random().toString(36).substring(2, 15);
            }
            if (!user.membershipId) {
                user.membershipId = `MEM${Date.now()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password') && user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to compare passwords
User.prototype.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
