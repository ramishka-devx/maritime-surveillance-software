// Creates (or resets the password of) analytic-service's machine account.
//
//   npm run service-account                       # generates a password and prints it once
//   SERVICE_ACCOUNT_PASSWORD=... npm run service-account
//
// Put the printed email/password in analytic-service/.env as META_SERVICE_EMAIL /
// META_SERVICE_PASSWORD. The account has the 'service' role only: post anomalies, read
// detector settings, report computed thresholds. Run after db:seed-permissions.
import crypto from 'node:crypto';
import { pool, query } from '../src/config/db.config.js';
import { hashPassword } from '../src/modules/users/user.model.js';

const SERVICE_PERMISSIONS = ['anomalies.create', 'detection.view', 'detection.report'];

async function main() {
  const email = process.env.SERVICE_ACCOUNT_EMAIL || 'analytic-service@serenguard.local';
  const generated = !process.env.SERVICE_ACCOUNT_PASSWORD;
  const password = process.env.SERVICE_ACCOUNT_PASSWORD || crypto.randomBytes(24).toString('base64url');

  await query('BEGIN');
  try {
    await query(
      `INSERT INTO roles (name, description, is_system, is_active)
       VALUES ('service', 'Machine account for analytic-service', 1, 1)
       ON CONFLICT (name) DO NOTHING`
    );
    const [role] = await query("SELECT role_id FROM roles WHERE name = 'service'");

    const placeholders = SERVICE_PERMISSIONS.map(() => '?').join(', ');
    const found = await query(`SELECT name FROM permissions WHERE name IN (${placeholders})`, SERVICE_PERMISSIONS);
    if (found.length !== SERVICE_PERMISSIONS.length) {
      throw new Error('Service permissions are missing. Run npm run db:seed-permissions first.');
    }
    await query(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT ?, permission_id FROM permissions WHERE name IN (${placeholders})
       ON CONFLICT DO NOTHING`,
      [role.role_id, ...SERVICE_PERMISSIONS]
    );

    const passwordHash = await hashPassword(password);
    const [existing] = await query('SELECT user_id FROM users WHERE email = ?', [email]);
    let userId = existing?.user_id;
    if (userId) {
      await query(
        "UPDATE users SET password_hash = ?, role_id = ?, status = 'verified', updated_at = NOW() WHERE user_id = ?",
        [passwordHash, role.role_id, userId]
      );
    } else {
      const result = await query(
        `INSERT INTO users (first_name, last_name, username, email, password_hash, role_id, status)
         VALUES ('Analytic', 'Service', 'analytic-service', ?, ?, ?, 'verified')`,
        [email, passwordHash, role.role_id]
      );
      userId = result.insertId;
    }
    await query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?) ON CONFLICT DO NOTHING', [userId, role.role_id]);
    await query('COMMIT');

    console.log(`Service account ready: ${email} (user_id ${userId}, role 'service')`);
    if (generated) {
      console.log('\nGenerated password (shown once, put it in analytic-service/.env):');
      console.log(`  META_SERVICE_EMAIL=${email}`);
      console.log(`  META_SERVICE_PASSWORD=${password}`);
    }
  } catch (err) {
    await query('ROLLBACK');
    throw err;
  }
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
