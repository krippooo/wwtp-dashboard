import mysql from "mysql2/promise"; 

const globalForPool = global as unknown as { _pool?: mysql.Pool };

export const pool = mysql.createPool({
  host: process.env.DB_HOST,        // 'localhost'
  user: process.env.DB_USER,        // 'broker'
  password: process.env.DB_PASS,    // 'hosting123'
  database: process.env.DB_NAME,    // 'tes_db'
  port: Number(process.env.DB_PORT), // 3308 in your case
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
