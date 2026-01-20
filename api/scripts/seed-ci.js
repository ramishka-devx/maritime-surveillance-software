import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = '3306',
  DB_USER = 'root',
  DB_PASSWORD = '',
  DB_NAME = 'machine_cure',
  CI_ADMIN_EMAIL = 'admin@example.com',
  CI_ADMIN_PASSWORD = 'Password123!',
} = process.env;

async function main() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });

  // Ensure admin role exists
  await conn.execute(
    'INSERT INTO roles (role_id, name) VALUES (1, \'admin\') ON DUPLICATE KEY UPDATE name = VALUES(name)'
  );

  // Ensure at least one division_type
  const [dt] = await conn.execute('SELECT division_type_id FROM division_types LIMIT 1');
  let divisionTypeId = dt[0]?.division_type_id;
  if (!divisionTypeId) {
    const [res] = await conn.execute(
      'INSERT INTO division_types (title) VALUES (?)',
      ['Factory']
    );
    divisionTypeId = res.insertId;
  }

  // Ensure at least one division
  const [div] = await conn.execute('SELECT division_id FROM divisions LIMIT 1');
  let divisionId = div[0]?.division_id;
  if (!divisionId) {
    const [res] = await conn.execute(
      'INSERT INTO divisions (title, division_type_id) VALUES (?, ?)',
      ['Main Division', divisionTypeId]
    );
    divisionId = res.insertId;
  }

  // Upsert CI admin user
  const password_hash = await bcrypt.hash(CI_ADMIN_PASSWORD, 10);
  const [existing] = await conn.execute('SELECT user_id FROM users WHERE email = ?', [CI_ADMIN_EMAIL]);
  if (existing.length === 0) {
    await conn.execute(
      'INSERT INTO users (first_name, last_name, email, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
      ['CI', 'Admin', CI_ADMIN_EMAIL, password_hash, 1]
    );
  } else {
    await conn.execute('UPDATE users SET password_hash = ? WHERE email = ?', [password_hash, CI_ADMIN_EMAIL]);
  }

  console.log('CI seed complete.');
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
