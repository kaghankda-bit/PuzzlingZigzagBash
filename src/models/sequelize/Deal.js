
const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Deal = sequelize.define('Deal', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    originalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discountedPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discountPercentage: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    validFrom: {
        type: DataTypes.DATE,
        allowNull: false
    },
    validUntil: {
        type: DataTypes.DATE,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    termsAndConditions: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    maxRedemptions: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    currentRedemptions: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'expired'),
        defaultValue: 'active'
    },
    partnerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Partners',
            key: 'id'
        }
    },
    merchantId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Merchants',
            key: 'id'
        }
    },
    location: {
        type: DataTypes.JSON,
        allowNull: true
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = Deal;
