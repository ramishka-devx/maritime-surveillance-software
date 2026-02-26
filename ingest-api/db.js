const { Pool } = require("pg");
const config = require("./config");

const pool = new Pool(config.database);

// Handle successful connection
pool.on("connect", () => {
  console.log("[DB] ✓ Connection pool established successfully");
});

// Handle connection errors
pool.on("error", (err) => {
  console.error("[DB] ✗ Unexpected error on idle client:", err);
});

// Test connection on startup
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("[DB] ✗ Failed to connect to database:", err.message);
    process.exit(1);
  } else {
    console.log("[DB] ✓ Database connection verified");
  }
});

module.exports = pool;
