import { query } from '../src/config/db.config.js';

const permissions = [
  // User permissions
  'user.list', 'user.update', 'user.status.update', 'user.role.update', 'user.analytics', 'user.delete',

  // Permission management
  'permission.add', 'permission.list', 'permission.delete', 'permission.assign', 'permission.revoke',

  // Role management
  'role.list', 'role.view', 'role.create', 'role.update', 'role.delete',

  // Division types
  'divisionType.add', 'divisionType.list', 'divisionType.update', 'divisionType.delete',

  // Divisions
  'division.add', 'division.list', 'division.update', 'division.delete',

  // Machines
  'machine.add', 'machine.list', 'machine.update', 'machine.delete',

  // Meters
  'meter.add', 'meter.list', 'meter.update', 'meter.delete',

  // Parameters
  'parameter.add', 'parameter.list', 'parameter.update', 'parameter.delete',

  // Breakdowns
  'breakdown.add', 'breakdown.list', 'breakdown.view', 'breakdown.update', 'breakdown.delete',
  'breakdown.updateStatus', 'breakdown.assign', 'breakdown.startRepair', 'breakdown.completeRepair',

  // Breakdown categories
  'breakdownCategory.add', 'breakdownCategory.list', 'breakdownCategory.view',
  'breakdownCategory.update', 'breakdownCategory.delete',

  // Breakdown statuses
  'breakdownStatus.add', 'breakdownStatus.list', 'breakdownStatus.view',
  'breakdownStatus.update', 'breakdownStatus.delete',

  // Breakdown comments
  'breakdown.comment.add', 'breakdown.comment.list', 'breakdown.comment.view',
  'breakdown.comment.update', 'breakdown.comment.delete',

  // Breakdown repairs
  'breakdown.repair.add', 'breakdown.repair.list', 'breakdown.repair.view',
  'breakdown.repair.update', 'breakdown.repair.start', 'breakdown.repair.complete', 'breakdown.repair.delete',

  // Breakdown analytics
  'breakdown.analytics.view',

  // Notifications
  'notification.list', 'notification.view', 'notification.read', 'notification.delete',

  // Dashboard
  'dashboard.view',

  // Activities
  'activity.list', 'activity.view',

  // Maintenance
  'maintenance.add', 'maintenance.list', 'maintenance.update', 'maintenance.delete', 'maintenance.status.update',

  // Kaizen
  'kaizen.create', 'kaizen.view', 'kaizen.update', 'kaizen.delete', 'kaizen.assign',
  'kaizen.approve', 'kaizen.comment', 'kaizen.view_all', 'kaizen.report', 'kaizen.manage'
];

async function seedPermissions() {
  try {
    console.log('Starting permission seeding...');

    // Insert all permissions
    const permissionValues = permissions.map(name => `('${name}')`).join(', ');
    const insertPermissionsQuery = `INSERT IGNORE INTO permissions (name) VALUES ${permissionValues}`;

    await query(insertPermissionsQuery);
    console.log(`Inserted ${permissions.length} permissions`);

    // Get admin role ID (assuming admin role exists)
    const [adminRole] = await query('SELECT role_id FROM roles WHERE name = ? OR name = ? OR name = ?', ['super.admin', 'user', 'engineer']);
    if (!adminRole) {
      throw new Error('Admin role not found. Please run the initial seed first.');
    }

    // Assign all permissions to admin role
    await query(`
      INSERT IGNORE INTO role_permissions (role_id, permission_id)
      SELECT ?, permission_id FROM permissions
    `, [adminRole.role_id]);
    console.log('Assigned all permissions to admin role');

    // Get user role ID
    const [userRole] = await query('SELECT role_id FROM roles WHERE name = ?', ['user']);
    if (userRole) {
      // Assign basic read permissions to user role
      const basicPermissions = [
        'user.list', 'division.list', 'divisionType.list', 'machine.list', 'meter.list',
        'parameter.list', 'breakdown.list', 'breakdown.view', 'breakdownCategory.list',
        'breakdownStatus.list', 'notification.list', 'notification.view', 'notification.read',
        'dashboard.view', 'kaizen.view', 'kaizen.create', 'activity.list', 'activity.view'
      ];

      const placeholders = basicPermissions.map(() => '?').join(',');
      await query(`
        INSERT IGNORE INTO role_permissions (role_id, permission_id)
        SELECT ?, permission_id FROM permissions WHERE name IN (${placeholders})
      `, [userRole.role_id, ...basicPermissions]);
      console.log('Assigned basic permissions to user role');
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