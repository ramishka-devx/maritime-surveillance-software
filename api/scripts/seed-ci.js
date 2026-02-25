import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '5432',
  DB_USER = 'postgres',
  DB_PASSWORD = '',
  DB_NAME = 'maritime_surveillance_db',
  CI_ADMIN_FIRST_NAME = 'CI',
  CI_ADMIN_LAST_NAME = 'Admin',
  CI_ADMIN_USERNAME = 'ci-admin',
  CI_ADMIN_EMAIL = 'admin@example.com',
  CI_ADMIN_PASSWORD = 'Password123!',
} = process.env;

async function main() {
  const client = new Client({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });

  await client.connect();

  // Ensure super_admin role exists (role_id=1 expected by code)
  await client.query(
    `INSERT INTO roles (role_id, name, description, is_system, is_active)
     VALUES (1, 'super_admin', 'Super administrator', 1, 1)
     ON CONFLICT (role_id) DO UPDATE
     SET name = EXCLUDED.name,
         description = EXCLUDED.description,
         is_system = EXCLUDED.is_system,
         is_active = EXCLUDED.is_active`
  );

  // Upsert CI admin user
  const password_hash = await bcrypt.hash(CI_ADMIN_PASSWORD, 10);
  await client.query(
    `INSERT INTO users (first_name, last_name, username, email, password_hash, role_id, status)
     VALUES ($1, $2, $3, $4, $5, 1, 'verified')
     ON CONFLICT (email) DO UPDATE
     SET password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         username = EXCLUDED.username,
         role_id = EXCLUDED.role_id,
         status = EXCLUDED.status`,
    [CI_ADMIN_FIRST_NAME, CI_ADMIN_LAST_NAME, CI_ADMIN_USERNAME, CI_ADMIN_EMAIL, password_hash]
  );

  // Ensure multi-role table has the primary role
  await client.query(
    `INSERT INTO user_roles (user_id, role_id)
     SELECT user_id, 1 FROM users WHERE email = $1
     ON CONFLICT DO NOTHING`,
    [CI_ADMIN_EMAIL]
  );

  const { rows: createdRows } = await client.query(
    `SELECT user_id, email, username, role_id, status
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [CI_ADMIN_EMAIL]
  );
  if (createdRows[0]) {
    console.log('Created/updated super_admin:', createdRows[0]);
  }

  console.log('CI seed complete.');
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
