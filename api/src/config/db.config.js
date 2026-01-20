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
  const target = `${env.db.host}:${env.db.port}`;
  const maxAttempts = Math.max(1, Number(env.db.connectRetries) + 1);

  const nonRetriableCodes = new Set([
    'ER_ACCESS_DENIED_ERROR',
    'ER_DBACCESS_DENIED_ERROR',
    'ER_HOST_NOT_PRIVILEGED',
    'ER_ACCOUNT_HAS_BEEN_LOCKED',
    'ER_PASSWORD_EXPIRED',
  ]);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const connection = await pool.getConnection();
      connection.release();

      logger.info(`MySQL database connected successfully (${target})`);
      return true;
    } catch (err) {
      const message = err?.message || String(err);
      const code = err?.code;

      if (code && nonRetriableCodes.has(code)) {
        logger.error(
          {
            err,
            code,
            dbHost: env.db.host,
            dbPort: env.db.port,
            dbName: env.db.database,
            failFast: env.db.failFast,
          },
          `MySQL connection failed (non-retriable: ${code}): ${message}`
        );

        if (env.db.failFast) {
          throw err;
        }

        return false;
      }

      if (attempt >= maxAttempts) {
        logger.error(
          {
            err,
            code,
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
          code,
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
  const [rows] = await pool.execute(sql, params);
  return rows;
}
