import { pool, query } from '../src/config/db.config.js';

// Permission names used by permissionMiddleware() across api/src
const permissions = [
  'activities.logs.list',
  'activities.logs.view',
  'ais.view',
  'alerts.acknowledge',
  'alerts.assign',
  'alerts.create',
  'alerts.dismiss',
  'alerts.list',
  'alerts.resolve',
  'alerts.update',
  'alerts.view',
  'analytics.dashboard.view',
  'dashboard.active_alerts.view',
  'dashboard.map.view',
  'notifications.delete',
  'notifications.view',
  'permissions.create',
  'permissions.delete',
  'permissions.list',
  'permissions.view',
  'roles.create',
  'roles.delete',
  'roles.list',
  'roles.permissions.assign',
  'roles.permissions.revoke',
  'roles.permissions.view',
  'roles.update',
  'roles.view',
  'users.activity.view',
  'users.list',
  'users.permissions.assign',
  'users.permissions.view',
  'users.roles.assign',
  'users.suspend',
  'users.update',
  'users.verify',
  'users.view',
  'vessels.create',
  'vessels.delete',
  'vessels.history.view',
  'vessels.list',
  'vessels.positions.create',
  'vessels.positions.view',
  'vessels.update',
  'vessels.view'
];

async function seedPermissions() {
  try {
    console.log('Starting permission seeding...');

    // Insert all permissions (also store module prefix for grouping)
    const rows = permissions.map(name => ({ name, module: name.split('.')[0] || null }));
    const placeholders = rows.map(() => '(?, ?)').join(', ');
    const params = rows.flatMap(p => [p.name, p.module]);
    const insertPermissionsQuery = `INSERT IGNORE INTO permissions (name, module) VALUES ${placeholders}`;
    await query(insertPermissionsQuery, params);
    console.log(`Inserted ${permissions.length} permissions`);

    // Super admin role
    const [superAdminRole] = await query('SELECT role_id FROM roles WHERE name = ? LIMIT 1', ['super_admin']);
    if (!superAdminRole) throw new Error('Role super_admin not found. Run db:seed first.');

    // Assign all permissions to admin role
    await query(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id)
      SELECT ?, permission_id FROM permissions
    `, [superAdminRole.role_id]);
    console.log('Assigned all permissions to super_admin role');

    // Operator role gets operational permissions
    const [operatorRole] = await query('SELECT role_id FROM roles WHERE name = ? LIMIT 1', ['operator']);
    if (operatorRole) {
      const operatorPermissions = [
        // Keep this intentionally minimal: operators can view the operational data,
        // while admins can grant additional permissions as needed.
        'ais.view',
        'vessels.list',
        'vessels.view',
        'vessels.positions.view',
        'alerts.list',
        'alerts.view',
        'notifications.view'
      ];

      const placeholders = operatorPermissions.map(() => '?').join(',');
      await query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        SELECT ?, permission_id FROM permissions WHERE name IN (${placeholders})
      `, [operatorRole.role_id, ...operatorPermissions]);
      console.log('Assigned operator permissions');
    }

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