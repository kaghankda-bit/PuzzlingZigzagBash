const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Merchant = sequelize.define('Merchant', {
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
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    logo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    images: {
        type: DataTypes.JSON,
        allowNull: true
    },
    businessHours: {
        type: DataTypes.JSON,
        allowNull: true
    },
    location: {
        type: DataTypes.JSON,
        allowNull: true
    },
    qrCode: {
        type: DataTypes.TEXT,
        allowNull: true,
        unique: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    rating: {
        type: DataTypes.DECIMAL(2, 1),
        defaultValue: 0.0
    },
    totalReviews: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    partnerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Partners',
            key: 'id'
        }
    }
}, {
    timestamps: true
});

module.exports = Merchant;