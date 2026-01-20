import mysql from 'mysql2/promise';
import { env } from './env.js';
import { logger } from './logger.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  enableKeepAlive: true,
  connectTimeout: env.db.connectTimeoutMs,
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let initPromise;

export async function initDbConnection() {
  const target = `${env.db.host}`;
  const maxAttempts = Math.max(1, Number(env.db.connectRetries) + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const connection = await pool.getConnection();
      connection.release();

      logger.info(`MySQL database connected successfully (${target})`);
      return true;
    } catch (err) {
      const message = err?.message || String(err);

      if (attempt >= maxAttempts) {
        logger.error(
          {
            err,
            dbHost: env.db.host,
            dbPort: env.db.port,
            dbName: env.db.database,
            failFast: env.db.failFast,
          },
          `MySQL connection failed after ${attempt} attempt(s): ${message}`
        );

        if (env.db.failFast) {
          throw err;
        }

        return false;
      }

      logger.warn(
        {
          err,
          attempt,
          remaining: maxAttempts - attempt,
          dbHost: env.db.host,
          dbPort: env.db.port,
        },
        `MySQL connection failed (attempt ${attempt}/${maxAttempts}). Retrying in ${env.db.connectRetryDelayMs}ms...`
      );

      await sleep(env.db.connectRetryDelayMs);
    }
  }

  return false;
}

export function startDbConnectionCheck() {
  if (!initPromise) {
    initPromise = initDbConnection();
  }
  return initPromise;
}

export async function query(sql, params) {
  const safeParams = params ?? [];
  const [rows] = await pool.query(sql, safeParams);
  return rows;
}
