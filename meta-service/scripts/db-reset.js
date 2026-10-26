// Drop and rebuild the whole database: TypeORM migrations, then the seeds.
//
//   node scripts/db-reset.js [--force]
//
// Refuses to run when NODE_ENV=production unless --force is passed.

import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';
import { env } from '../src/config/env.js';

const { Client } = pg;
const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const metaDir = path.resolve(scriptsDir, '..');
const force = process.argv.includes('--force');

if (env.nodeEnv === 'production' && !force) {
  console.error('Refusing to reset the database with NODE_ENV=production (pass --force to override).');
  process.exit(1);
}

// SQL files run through run-sql.js (statement-split, placeholder-safe), after migrations.
const sqlFiles = ['db/seed.sql'];
// Node scripts run afterwards.
const nodeScripts = ['scripts/seed-permissions.js'];

async function recreateDatabase() {
  const dbName = String(env.db.database);
  const admin = new Client({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: 'postgres',
  });

  await admin.connect();
  try {
    const ident = '"' + dbName.replace(/"/g, '""') + '"';
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity
       WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName],
    );
    await admin.query(`DROP DATABASE IF EXISTS ${ident}`);
    await admin.query(`CREATE DATABASE ${ident}`);
    console.log(`Recreated database ${dbName}`);
  } finally {
    await admin.end();
  }
}

function run(cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`);
  execFileSync(cmd, args, { cwd: metaDir, stdio: 'inherit' });
}

(async () => {
  try {
    await recreateDatabase();
    run('npx', ['typeorm', 'migration:run', '-d', 'src/db/data-source.js']);
    for (const file of sqlFiles) {
      run(process.execPath, ['scripts/run-sql.js', file]);
    }
    for (const script of nodeScripts) {
      run(process.execPath, [script]);
    }
    console.log('\nDatabase reset complete.');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
