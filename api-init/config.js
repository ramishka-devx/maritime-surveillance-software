require("dotenv").config();

const config = {
  database: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "ais_db",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    max: parseInt(process.env.DB_MAX_CONNECTIONS || "20", 10)
  },
  ais: {
    apiKey: process.env.AIS_STREAM_IO_API_KEY,
    wsUrl: "wss://stream.aisstream.io/v0/stream"
  },
  environment: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info"
};

// Validate required environment variables
if (!config.database.password) {
  throw new Error("DB_PASSWORD environment variable is required");
}

if (!config.ais.apiKey) {
  throw new Error("AIS_STREAM_IO_API_KEY environment variable is required");
}

module.exports = config;
