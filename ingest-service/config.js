require("dotenv").config();

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

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
  kafka: {
    enabled: parseBoolean(process.env.KAFKA_ENABLED, true),
    brokers: (process.env.KAFKA_BROKERS || "localhost:9092")
      .split(",")
      .map((broker) => broker.trim())
      .filter(Boolean),
    clientId: process.env.KAFKA_CLIENT_ID || "maritime-ais-stream",
    groupId: process.env.KAFKA_GROUP_ID || "maritime-ais-stream-consumers",
    topic: process.env.KAFKA_TOPIC || "ais.raw.messages",
    partitions: parseInt(process.env.KAFKA_TOPIC_PARTITIONS || "1", 10),
    replicationFactor: parseInt(process.env.KAFKA_TOPIC_REPLICATION_FACTOR || "1", 10)
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

if (config.kafka.enabled && config.kafka.brokers.length === 0) {
  throw new Error("KAFKA_BROKERS environment variable is required");
}

module.exports = config;
