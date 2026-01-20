import { query } from '../src/config/db.config.js';

// Maritime Surveillance permissions
const permissions = [
  // Users
  'user.list', 'user.view', 'user.update', 'user.status.update', 'user.role.update',

  // Roles & permissions
  'role.list', 'role.view', 'role.create', 'role.update', 'role.delete',
  'permission.list', 'permission.assign', 'permission.revoke',

  // Vessels
  'vessel.create', 'vessel.list', 'vessel.view', 'vessel.update', 'vessel.delete',

  // Positions
  'position.create', 'position.list', 'position.view',

  // Alerts
  'alert.create', 'alert.list', 'alert.view', 'alert.update', 'alert.updateStatus', 'alert.assign',

  // Notifications
  'notification.list', 'notification.view', 'notification.read', 'notification.delete',

  // Activities
  'activity.list', 'activity.view'
];

async function seedPermissions() {
  try {
    console.log('Starting permission seeding...');

    // Insert all permissions
    const permissionValues = permissions.map(name => `('${name}')`).join(', ');
    const insertPermissionsQuery = `INSERT IGNORE INTO permissions (name) VALUES ${permissionValues}`;

    await query(insertPermissionsQuery);
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
        'vessel.list', 'vessel.view',
        'position.create', 'position.list', 'position.view',
        'alert.create', 'alert.list', 'alert.view', 'alert.updateStatus',
        'notification.list', 'notification.view', 'notification.read',
        'activity.list', 'activity.view'
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
    process.exit(1);
  }
}

seedPermissions();