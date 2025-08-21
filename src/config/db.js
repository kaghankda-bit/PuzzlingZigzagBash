
const { Pool } = require('pg');

let pool;

const connectDB = async () => {
    try {
        // Create a connection pool for PostgreSQL
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                require: true,
                rejectUnauthorized: false
            },
            max: 10, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        // Test the connection
        const client = await pool.connect();
        console.log(`PostgreSQL Connected: ${client.host || 'Connected'}`);
        client.release();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('Database pool not initialized. Call connectDB first.');
    }
    return pool;
};

module.exports = { connectDB, getPool };
