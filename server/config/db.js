const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
  host:             process.env.DB_HOST     || "localhost",
  user:             process.env.DB_USER     || "root",
  port:             parseInt(process.env.DB_PORT) || 3306,
  password:         process.env.DB_PASSWORD || "",
  database:         process.env.DB_NAME     || "studyfetch2",
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0
});

async function connectDB() {
  try {
    const conn = await db.getConnection();
    console.log("✅ MySQL Connected");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = { db, connectDB };
