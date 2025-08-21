const { Sequelize } = require("sequelize");
const fs = require("fs");

const sequelize = new Sequelize(
    "defaultdb",
    "avnadmin",
    "AVNS_5Rbv7qUFbiK6tz3YW3P",
    {
        host: "privilegeapp-murshad9799-c616.c.aivencloud.com",
        port: 24287,
        dialect: "postgres",
        protocol: "postgres",
        logging: process.env.NODE_ENV === "development" ? console.log : false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
            },
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
