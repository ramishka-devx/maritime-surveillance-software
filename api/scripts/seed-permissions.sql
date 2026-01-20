-- Script to seed all permissions and assign them to roles
-- This script should be run after the initial schema and seed data are loaded

USE machine_cure_db;

-- Define all permissions from the system
SET @all_perms = 'user.list,user.update,user.status.update,user.role.update,user.analytics,user.delete,permission.add,permission.list,permission.delete,permission.assign,permission.revoke,role.list,role.view,role.create,role.update,role.delete,divisionType.add,divisionType.list,divisionType.update,divisionType.delete,division.add,division.list,division.update,division.delete,machine.add,machine.list,machine.update,machine.delete,meter.add,meter.list,meter.update,meter.delete,parameter.add,parameter.list,parameter.update,parameter.delete,breakdown.add,breakdown.list,breakdown.view,breakdown.update,breakdown.delete,breakdown.updateStatus,breakdown.assign,breakdown.startRepair,breakdown.completeRepair,breakdownCategory.add,breakdownCategory.list,breakdownCategory.view,breakdownCategory.update,breakdownCategory.delete,breakdownStatus.add,breakdownStatus.list,breakdownStatus.view,breakdownStatus.update,breakdownStatus.delete,breakdown.comment.add,breakdown.comment.list,breakdown.comment.view,breakdown.comment.update,breakdown.comment.delete,breakdown.repair.add,breakdown.repair.list,breakdown.repair.view,breakdown.repair.update,breakdown.repair.start,breakdown.repair.complete,breakdown.repair.delete,breakdown.analytics.view,notification.list,notification.view,notification.read,notification.delete,dashboard.view,activity.list,activity.view,maintenance.add,maintenance.list,maintenance.update,maintenance.delete,maintenance.status.update,kaizen.create,kaizen.view,kaizen.update,kaizen.delete,kaizen.assign,kaizen.approve,kaizen.comment,kaizen.view_all,kaizen.report,kaizen.manage';

-- Insert all permissions if they don't exist
DROP TEMPORARY TABLE IF EXISTS tmp_all_perms;
CREATE TEMPORARY TABLE tmp_all_perms (name VARCHAR(100) UNIQUE);
SET @sql = CONCAT('INSERT IGNORE INTO permissions (name) VALUES ', REPLACE(@all_perms, ',', "'), ('"), "('");
SET @sql = REPLACE(@sql, "VALUES ", "VALUES ('");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Assign all permissions to admin role (role_id = 1)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions;

-- Assign basic read permissions to user role (role_id = 2) for common operations
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, p.permission_id
FROM permissions p
WHERE p.name IN (
    'user.list',
    'division.list',
    'divisionType.list',
    'machine.list',
    'meter.list',
    'parameter.list',
    'breakdown.list',
    'breakdown.view',
    'breakdownCategory.list',
    'breakdownStatus.list',
    'notification.list',
    'notification.view',
    'notification.read',
    'dashboard.view',
    'kaizen.view',
    'kaizen.create'
);

-- Output results
SELECT 'Permissions seeded successfully' as status;
SELECT COUNT(*) as total_permissions FROM permissions;
SELECT r.name as role_name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_id, r.name;