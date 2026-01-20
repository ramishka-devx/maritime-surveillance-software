-- Seed roles
INSERT INTO roles (role_id, name) VALUES (1, 'admin') ON DUPLICATE KEY UPDATE name = VALUES(name);
INSERT INTO roles (role_id, name) VALUES (2, 'user') ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed permissions
SET @perms = 'user.list,user.update,user.status.update,user.analytics,user.delete,permission.add,permission.list,permission.delete,permission.assign,permission.revoke,divisionType.add,divisionType.list,divisionType.update,divisionType.delete,division.add,division.list,division.update,division.delete,machine.add,machine.list,machine.update,machine.delete,meter.add,meter.list,meter.update,meter.delete,parameter.add,parameter.list,parameter.update,parameter.delete,breakdown.add,breakdown.list,breakdown.view,breakdown.update,breakdown.delete,breakdown.updateStatus,breakdown.assign,breakdown.startRepair,breakdown.completeRepair,breakdownCategory.add,breakdownCategory.list,breakdownCategory.update,breakdownCategory.delete,breakdownStatus.add,breakdownStatus.list,breakdownStatus.update,breakdownStatus.delete,breakdownComment.add,breakdownComment.list,breakdownComment.update,breakdownComment.delete,breakdownRepair.add,breakdownRepair.list,breakdownRepair.update,breakdownRepair.delete,notification.list,notification.view,notification.read,notification.delete';

-- Insert permissions if not exists
DROP TEMPORARY TABLE IF EXISTS tmp_perms;
CREATE TEMPORARY TABLE tmp_perms (name VARCHAR(100) UNIQUE);
SET @sql = CONCAT('INSERT IGNORE INTO permissions (name) VALUES ', REPLACE(@perms, ',', "'), ('"), "('");
SET @sql = REPLACE(@sql, "VALUES ", "VALUES ('");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Grant all permissions to admin (role_id = 1)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions;

-- Seed breakdown_statuses
INSERT IGNORE INTO breakdown_statuses (name, description, sort_order) VALUES
-- Core workflow statuses
('Reported', 'Initial status when a breakdown is first reported', 1),
('Open', 'Breakdown has been acknowledged but not yet assigned', 2),
('Assigned', 'Breakdown has been assigned to a technician', 3),
('In Repair', 'Repair work is currently in progress', 4),
('Completed', 'Repair work has been completed', 5),
('Verified', 'Repair has been verified and tested', 6),
('Closed', 'Breakdown issue has been fully resolved', 7),
-- Additional workflow statuses
('On Hold', 'Repair work is temporarily paused (waiting for parts, approval, etc.)', 8),
('Cancelled', 'Breakdown report was invalid or cancelled', 9);

-- Seed breakdown_categories
INSERT IGNORE INTO breakdown_categories (name, description) VALUES
('Mechanical', 'Issues related to mechanical components, moving parts, wear and tear'),
('Electrical', 'Problems with electrical systems, wiring, motors, controls'),
('Software', 'Issues with software, programming, automation systems'),
('Hydraulic', 'Problems with hydraulic systems, pumps, cylinders, fluid leaks'),
('Pneumatic', 'Issues with compressed air systems, valves, actuators'),
('Safety', 'Safety system failures, emergency stops, protective equipment'),
('Calibration', 'Accuracy issues, measurement problems, sensor drift'),
('Lubrication', 'Problems with lubrication systems, oil leaks, grease issues'),
('Cooling', 'Overheating issues, cooling system failures, ventilation problems'),
('Material Handling', 'Conveyor issues, feeding problems, material flow disruptions'),
('Quality', 'Product quality issues caused by machine problems'),
('Other', 'Issues that do not fit into other categories');
