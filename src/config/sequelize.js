const { Sequelize } = require("sequelize");
const fs = require("fs");

const sequelize = new Sequelize(process.env.DATABASE_URL || "postgresql://avnadmin:AVNS_5Rbv7qUFbiK6tz3YW3P@privilegeapp-murshad9799-c616.c.aivencloud.com:24287/defaultdb", {
        dialect: "postgres",
        protocol: "postgres",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
    },
);

module.exports = sequelize;
