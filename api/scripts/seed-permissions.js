import { pool, query } from '../src/config/db.config.js';

// Permission names used by permissionMiddleware() across api/src
const permissions = [
  'dashboard.view',
  'alert.view',
  'alert.status.view',
  'reports.view',
  'report.download',
  'users.list',
  'users.view',
  'user.status.update'
];

async function seedPermissions() {
  try {
    console.log('Starting permission seeding...');

    // Replace existing permission vocabulary with the current, allowed set.
    // This intentionally removes older permissions so super admins can only grant
    // the permissions defined above.
    const inList = permissions.map(() => '?').join(', ');
    await query('BEGIN');

    await query(
      `DELETE FROM role_permissions WHERE permission_id IN (SELECT permission_id FROM permissions WHERE name NOT IN (${inList}))`,
      permissions,
    );
    await query(
      `DELETE FROM user_permissions WHERE permission_id IN (SELECT permission_id FROM permissions WHERE name NOT IN (${inList}))`,
      permissions,
    );
    await query(`DELETE FROM permissions WHERE name NOT IN (${inList})`, permissions);

    // Insert all permissions (also store module prefix for grouping)
    const rows = permissions.map(name => ({ name, module: name.split('.')[0] || null }));
    const placeholders = rows.map(() => '(?, ?)').join(', ');
    const params = rows.flatMap(p => [p.name, p.module]);
    const insertPermissionsQuery = `
      INSERT INTO permissions (name, module)
      VALUES ${placeholders}
      ON CONFLICT (name) DO UPDATE
      SET module = EXCLUDED.module,
          is_active = 1
    `;
    await query(insertPermissionsQuery, params);
    console.log(`Inserted ${permissions.length} permissions`);

    // Super admin role
    const [superAdminRole] = await query('SELECT role_id FROM roles WHERE name = ? LIMIT 1', ['super_admin']);
    if (!superAdminRole) throw new Error('Role super_admin not found. Run db:seed first.');

    // Assign all permissions to admin role
    await query(
      `
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT ?, permission_id FROM permissions
        ON CONFLICT DO NOTHING
      `,
      [superAdminRole.role_id],
    );
    console.log('Assigned all permissions to super_admin role');

    // Operator role gets basic operational permissions
    const [operatorRole] = await query('SELECT role_id FROM roles WHERE name = ? LIMIT 1', ['operator']);
    if (operatorRole) {
      const operatorPermissions = [
        'dashboard.view',
        'alert.view',
        'reports.view'
      ];

      const placeholders = operatorPermissions.map(() => '?').join(',');
      await query(`
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT ?, permission_id FROM permissions WHERE name IN (${placeholders})
        ON CONFLICT DO NOTHING
      `, [operatorRole.role_id, ...operatorPermissions]);
      console.log('Assigned operator permissions');
    }

    await query('COMMIT');

    // Show results
    const [permissionCount] = await query('SELECT COUNT(*) as count FROM permissions');
    console.log(`Total permissions in database: ${permissionCount.count}`);

    const roleStats = await query(`
      SELECT r.name, COUNT(rp.permission_id) as permission_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
      GROUP BY r.role_id, r.name
    `);

    console.log('\nRole permission assignments:');
    roleStats.forEach(row => {
      console.log(`- ${row.name}: ${row.permission_count} permissions`);
    });

    console.log('\nPermission seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding permissions:', error);
    try {
      await query('ROLLBACK');
    } catch {
      // ignore
    }
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch {
      // ignore
    }
  }
}

seedPermissions();