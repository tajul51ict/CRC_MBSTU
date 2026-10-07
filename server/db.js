const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

if (process.env.MYSQL_URL || process.env.DATABASE_URL) {
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
  console.log(`[Database] Connecting using connection URL`);
  pool = mysql.createPool(url);
} else {
  console.log(`[Database] Connecting to ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}, DB: ${process.env.DB_NAME || 'crc_mbstu_db'}`);
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crc_mbstu_db',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    // SSL required for cloud databases (Aiven, PlanetScale, etc.)
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
}

module.exports = pool;

