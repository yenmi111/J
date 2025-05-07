require('dotenv').config();
const mariadb = require('mariadb');

// 建立資料庫連線池
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, 
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 3
});

// 匯出資料庫連線
module.exports = pool;
