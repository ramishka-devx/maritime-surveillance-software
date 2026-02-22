import { env } from '../src/config/env.js';
import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

function splitSqlStatements(sql) {
  // Split on semicolons that are not inside string literals.
  const statements = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let prevChar = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'" && !inDouble && prevChar !== '\\') inSingle = !inSingle;
    else if (ch === '"' && !inSingle && prevChar !== '\\') inDouble = !inDouble;

    if (ch === ';' && !inSingle && !inDouble) {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
    prevChar = ch;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

(async function main() {
  try {
    const file = process.argv[2];
    if (!file) throw new Error('SQL file path required');
  const sql = fs.readFileSync(file, 'utf8');

    // Handle phpMyAdmin dumps that include DELIMITER/DEFINER by stripping routine blocks.
    // Note: We don't need stored routines for CI; removing them is safe for our use.
    let sqlToRun = sql;
    const hasDelimiter = /\bDELIMITER\b/i.test(sqlToRun);
    const hasRoutine = /\bCREATE\s+(DEFINER\s*=\s*[^\s]+\s*)?(PROCEDURE|FUNCTION|TRIGGER)\b/i.test(sqlToRun);
    if (hasDelimiter || hasRoutine) {
      console.warn('\n⚠️  Detected DELIMITER/Stored Routines in SQL. Stripping routine blocks and DEFINER clauses for CI...');
      // Remove DEFINER=... qualifiers
      sqlToRun = sqlToRun.replace(/DEFINER=`[^`]+`@`[^`]+`\s*/gi, '');
      // Remove blocks between DELIMITER ... and the next DELIMITER ... (non-greedy)
      // This aims to drop stored procedures/functions/triggers sections entirely.
      let before;
      do {
        before = sqlToRun;
        sqlToRun = sqlToRun.replace(/\n?DELIMITER\s+[^\n]+[\s\S]*?\nDELIMITER\s+[^\n]+\n?/gi, '\n');
      } while (sqlToRun !== before);
      // Also remove any stray DELIMITER lines
      sqlToRun = sqlToRun.replace(/^DELIMITER\s+.*$/gim, '');
    }
    // Try to ensure the database exists (best-effort).
    // If the user doesn't have CREATEDB, we'll continue and assume DB already exists.
    const adminClient = new Client({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: 'postgres'
    });
    try {
      await adminClient.connect();
      const dbName = String(env.db.database);
      const exists = await adminClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
      if (exists.rowCount === 0) {
        const ident = '"' + dbName.replace(/"/g, '""') + '"';
        await adminClient.query(`CREATE DATABASE ${ident}`);
      }
    } catch (e) {
      // ignore (db may exist, or insufficient privileges)
    } finally {
      try { await adminClient.end(); } catch { /* ignore */ }
    }

    const client = new Client({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.database
    });
    await client.connect();
    // Execute statements individually for clearer diagnostics and to avoid empty-statement errors
    const statements = splitSqlStatements(sqlToRun);
    for (const [idx, stmt] of statements.entries()) {
      try {
        await client.query(stmt);
      } catch (err) {
        const snippet = stmt.length > 300 ? stmt.slice(0, 300) + '…' : stmt;
        console.error(`\n❌ SQL error in ${file} at statement #${idx + 1}:\n${snippet}\n`);
        throw err;
      }
    }
    console.log(`SQL executed for ${file} (${statements.length} statements)`);
    await client.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
