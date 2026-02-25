import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

const { Pool } = pg;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function transformPlaceholders(sql) {
  // Convert MySQL-style `?` placeholders to PostgreSQL `$1, $2, ...`.
  // This is a best-effort transformer that skips quoted strings and comments.
  let index = 0;
  let out = '';
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let prev = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = i + 1 < sql.length ? sql[i + 1] : '';

    // End line comment
    if (inLineComment) {
      out += ch;
      if (ch === '\n') {
        inLineComment = false;
      }
      prev = ch;
      continue;
    }

    // End block comment
    if (inBlockComment) {
      out += ch;
      if (ch === '*' && next === '/') {
        out += next;
        i++;
        inBlockComment = false;
        prev = '/';
        continue;
      }
      prev = ch;
      continue;
    }

    // Start comments (only when not inside quotes)
    if (!inSingle && !inDouble) {
      if (ch === '-' && next === '-') {
        out += ch + next;
        i++;
        inLineComment = true;
        prev = '-';
        continue;
      }
      if (ch === '/' && next === '*') {
        out += ch + next;
        i++;
        inBlockComment = true;
        prev = '*';
        continue;
      }
    }

    if (ch === "'" && !inDouble && prev !== '\\') inSingle = !inSingle;
    if (ch === '"' && !inSingle && prev !== '\\') inDouble = !inDouble;

    if (ch === '?' && !inSingle && !inDouble) {
      index += 1;
      out += `$${index}`;
    } else {
      out += ch;
    }

    prev = ch;
  }

  return out;
}

function transformInsertIgnore(sql) {
  // MySQL: INSERT IGNORE INTO ...
  // Postgres: INSERT INTO ... ON CONFLICT DO NOTHING
  // Note: If query already has ON CONFLICT, we leave it.
  const re = /^\s*insert\s+ignore\s+into\s+/i;
  if (!re.test(sql)) return sql;
  if (/\bon\s+conflict\b/i.test(sql)) return sql.replace(re, 'INSERT INTO ');
  return sql.replace(re, 'INSERT INTO ') + ' ON CONFLICT DO NOTHING';
}

function stripTrailingSemicolon(sql) {
  return sql.replace(/;\s*$/, '');
}

function getInsertReturningClause(sql) {
  // Best-effort: infer primary key column for common tables.
  // We alias as insert_id so existing MySQL-like callers can read result.insertId.
  const m = /^\s*insert\s+into\s+([\w."]+)/i.exec(sql);
  if (!m) return null;

  const raw = m[1];
  const unquoted = raw.replace(/"/g, '');
  const table = unquoted.split('.').pop().toLowerCase();

  const tableToPk = {
    users: 'user_id',
    roles: 'role_id',
    permissions: 'permission_id',
    vessels: 'vessel_id',
    alerts: 'alert_id',
    notifications: 'notification_id',
    activities: 'activity_id',
    vessel_positions: 'position_id',
  };

  const pk = tableToPk[table];
  if (!pk) return null;
  return ` RETURNING ${pk} AS insert_id`;
}

function transformInsertReturning(sql) {
  // Many existing models expect result.insertId from INSERT.
  // PostgreSQL doesn't provide that unless RETURNING is used.
  const stripped = stripTrailingSemicolon(sql);
  if (!/^\s*insert\b/i.test(stripped)) return sql;
  if (/\breturning\b/i.test(stripped)) return sql;

  const returning = getInsertReturningClause(stripped);
  if (!returning) return sql;

  return stripped + returning;
}

function normalizeSql(sql) {
  return transformPlaceholders(transformInsertReturning(transformInsertIgnore(sql)));
}

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: env.db.connectTimeoutMs,
});

let initPromise;

export async function initDbConnection() {
  const target = `${env.db.host}:${env.db.port}/${env.db.database}`;
  const maxAttempts = Math.max(1, Number(env.db.connectRetries) + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } finally {
        client.release();
      }

      logger.info(`PostgreSQL database connected successfully (${target})`);
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
          `PostgreSQL connection failed after ${attempt} attempt(s): ${message}`,
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
        `PostgreSQL connection failed (attempt ${attempt}/${maxAttempts}). Retrying in ${env.db.connectRetryDelayMs}ms...`,
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

function toMySqlLikeResult(pgResult) {
  // Many models expect { insertId, affectedRows }.
  // For INSERT ... RETURNING id, we set insertId.
  const affectedRows = Number(pgResult?.rowCount || 0);
  const insertId =
    pgResult?.rows && pgResult.rows.length > 0
      ? pgResult.rows[0].insert_id ?? pgResult.rows[0].id ?? pgResult.rows[0].user_id ?? pgResult.rows[0].role_id
      : undefined;
  return { insertId, affectedRows, rowCount: affectedRows };
}

export async function query(sql, params) {
  const safeParams = params ?? [];
  const normalizedSql = normalizeSql(sql);

  const isSelectLike = /^\s*(select|with)\b/i.test(normalizedSql);
  const hasReturning = /\breturning\b/i.test(normalizedSql);
  const isInsertLike = /^\s*insert\b/i.test(normalizedSql);

  let result;
  try {
    result = await pool.query(normalizedSql, safeParams);
  } catch (err) {
    try {
      err.query = normalizedSql;
      err.params = safeParams;
    } catch {
      // ignore
    }
    throw err;
  }

  if (isSelectLike) {
    return result.rows;
  }

  if (hasReturning) {
    // For INSERT ... RETURNING we still want to preserve the MySQL-ish insertId shape.
    if (isInsertLike) {
      return toMySqlLikeResult(result);
    }
    return result.rows;
  }

  // MySQL driver returns an "OkPacket" for non-SELECT.
  // Return a MySQL-ish shape for compatibility.
  return toMySqlLikeResult(result);
}
