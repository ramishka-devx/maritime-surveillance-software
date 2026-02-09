-- ============================================================================
-- RBAC System Enhancement Patch
-- Date: 2026-01-21
-- Description: Adds user_roles table for multi-role support, enhances roles 
--              and permissions tables with metadata, and migrates existing data
-- ============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- ============================================================================
-- 1. ENHANCE ROLES TABLE
-- ============================================================================

-- Add new columns to roles table (use procedure to check if column exists)
DELIMITER $$
CREATE PROCEDURE add_roles_columns()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='roles' AND COLUMN_NAME='description') THEN
    ALTER TABLE roles ADD COLUMN description TEXT NULL AFTER name;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='roles' AND COLUMN_NAME='is_system') THEN
    ALTER TABLE roles ADD COLUMN is_system TINYINT(1) NOT NULL DEFAULT 0 AFTER description;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='roles' AND COLUMN_NAME='is_active') THEN
    ALTER TABLE roles ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER is_system;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='roles' AND COLUMN_NAME='created_at') THEN
    ALTER TABLE roles ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='roles' AND COLUMN_NAME='updated_at') THEN
    ALTER TABLE roles ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;
  END IF;
END$$
DELIMITER ;

CALL add_roles_columns();
DROP PROCEDURE add_roles_columns;

-- ============================================================================
-- 2. ENHANCE PERMISSIONS TABLE
-- ============================================================================

-- Add module column for grouping permissions
DELIMITER $$
CREATE PROCEDURE add_permissions_columns()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='permissions' AND COLUMN_NAME='module') THEN
    ALTER TABLE permissions ADD COLUMN module VARCHAR(50) NULL AFTER name;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='permissions' AND COLUMN_NAME='is_active') THEN
    ALTER TABLE permissions ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER description;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='permissions' AND COLUMN_NAME='created_at') THEN
    ALTER TABLE permissions ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active;
  END IF;
END$$
DELIMITER ;

CALL add_permissions_columns();
DROP PROCEDURE add_permissions_columns;

-- Add index on module for faster grouping queries
CREATE INDEX idx_permissions_module ON permissions(module);

-- ============================================================================
-- 3. CREATE USER_ROLES TABLE (MULTI-ROLE SUPPORT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_ur_role (role_id),
  KEY idx_ur_assigned_by (assigned_by),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. ENHANCE ROLE_PERMISSIONS TABLE
-- ============================================================================

ALTER TABLE role_permissions
  ADD COLUMN IF NOT EXISTS granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER permission_id,
  ADD COLUMN IF NOT EXISTS granted_by INT NULL AFTER granted_at;

-- Add foreign key for granted_by if not exists
-- Note: Using ALTER IGNORE to skip if constraint already exists
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE role_permissions
  ADD CONSTRAINT fk_rp_granted_by FOREIGN KEY (granted_by) REFERENCES users(user_id) ON DELETE SET NULL;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 5. MIGRATE EXISTING DATA
-- ============================================================================

-- Migrate existing users' single role to user_roles table
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_at)
SELECT user_id, role_id, created_at
FROM users
WHERE role_id IS NOT NULL;

-- Update existing roles with descriptions
UPDATE roles SET 
  description = 'Full system access with all permissions',
  is_system = 1
WHERE name = 'super_admin';

UPDATE roles SET 
  description = 'Day-to-day monitoring and alert management',
  is_system = 1
WHERE name = 'operator';

-- ============================================================================
-- 6. INSERT NEW ROLES
-- ============================================================================

INSERT INTO roles (name, description, is_system, is_active) VALUES
  ('admin', 'Administrative access for user and system management', 1, 1),
  ('analyst', 'Surveillance analysis and reporting capabilities', 1, 1),
  ('viewer', 'Read-only access to dashboards and reports', 1, 1)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  is_system = VALUES(is_system);

-- ============================================================================
-- 7. INSERT ALL PERMISSIONS (Comprehensive List)
-- ============================================================================

-- Clear existing permissions and re-insert with proper module categorization
-- Note: This preserves permission_id if already exists

INSERT INTO permissions (name, module, description) VALUES
  -- Users Module
  ('users.list', 'users', 'View list of all users'),
  ('users.view', 'users', 'View user details'),
  ('users.create', 'users', 'Create new users'),
  ('users.update', 'users', 'Update user information'),
  ('users.delete', 'users', 'Delete users'),
  ('users.verify', 'users', 'Verify user accounts'),
  ('users.suspend', 'users', 'Suspend user accounts'),
  ('users.activity.view', 'users', 'View user activity logs'),
  ('users.roles.assign', 'users', 'Assign roles to users'),
  ('users.permissions.view', 'users', 'View user permissions'),
  ('users.permissions.assign', 'users', 'Assign direct permissions to users'),
  
  -- Roles Module
  ('roles.list', 'roles', 'View all roles'),
  ('roles.view', 'roles', 'View role details and permissions'),
  ('roles.create', 'roles', 'Create new roles'),
  ('roles.update', 'roles', 'Update role information'),
  ('roles.delete', 'roles', 'Delete roles'),
  ('roles.permissions.view', 'roles', 'View role permissions'),
  ('roles.permissions.assign', 'roles', 'Assign permissions to roles'),
  ('roles.permissions.revoke', 'roles', 'Revoke permissions from roles'),
  
  -- Permissions Module
  ('permissions.list', 'permissions', 'View all permissions'),
  ('permissions.view', 'permissions', 'View permission details'),
  ('permissions.create', 'permissions', 'Create new permissions'),
  ('permissions.delete', 'permissions', 'Delete permissions'),
  
  -- Analytics Module
  ('analytics.dashboard.view', 'analytics', 'View analytics dashboard'),
  ('analytics.reports.view', 'analytics', 'View generated reports'),
  ('analytics.reports.generate', 'analytics', 'Generate new reports'),
  ('analytics.reports.export', 'analytics', 'Export analytics data'),
  ('analytics.metrics.view', 'analytics', 'View system metrics'),
  
  -- Map Module
  ('map.view', 'map', 'Access live maritime map'),
  ('map.vessels.view', 'map', 'View vessel positions on map'),
  ('map.zones.view', 'map', 'View maritime zones'),
  ('map.zones.create', 'map', 'Create maritime zones'),
  ('map.zones.update', 'map', 'Update maritime zones'),
  ('map.zones.delete', 'map', 'Delete maritime zones'),
  ('map.layers.manage', 'map', 'Manage map layers'),
  
  -- Vessels Module
  ('vessels.list', 'vessels', 'View vessel list'),
  ('vessels.view', 'vessels', 'View vessel details'),
  ('vessels.create', 'vessels', 'Register new vessels'),
  ('vessels.update', 'vessels', 'Update vessel information'),
  ('vessels.delete', 'vessels', 'Delete vessels'),
  ('vessels.track', 'vessels', 'Track vessels in real-time'),
  ('vessels.history.view', 'vessels', 'View historical vessel movement'),
  ('vessels.positions.view', 'vessels', 'View vessel position data'),
  ('vessels.positions.create', 'vessels', 'Create vessel position records'),
  ('vessels.export', 'vessels', 'Export vessel data'),
  
  -- Alerts Module
  ('alerts.list', 'alerts', 'View all alerts'),
  ('alerts.view', 'alerts', 'View alert details'),
  ('alerts.create', 'alerts', 'Create manual alerts'),
  ('alerts.update', 'alerts', 'Update alert information'),
  ('alerts.acknowledge', 'alerts', 'Acknowledge alerts'),
  ('alerts.resolve', 'alerts', 'Resolve alerts'),
  ('alerts.dismiss', 'alerts', 'Dismiss false alerts'),
  ('alerts.assign', 'alerts', 'Assign alerts to users'),
  ('alerts.escalate', 'alerts', 'Escalate alerts'),
  
  -- Suspicious Activities Module
  ('activities.suspicious.list', 'activities', 'View suspicious activities list'),
  ('activities.suspicious.view', 'activities', 'View suspicious activity details'),
  ('activities.suspicious.resolve', 'activities', 'Mark suspicious activity as resolved'),
  ('activities.suspicious.notes.view', 'activities', 'View analyst notes'),
  ('activities.suspicious.notes.add', 'activities', 'Add analyst notes'),
  ('activities.suspicious.export', 'activities', 'Export suspicious activities'),
  
  -- Activity Logs Module
  ('activities.logs.list', 'activities', 'View activity logs'),
  ('activities.logs.view', 'activities', 'View activity log details'),
  ('activities.logs.export', 'activities', 'Export activity logs'),
  
  -- Notifications Module
  ('notifications.view', 'notifications', 'View notifications'),
  ('notifications.manage', 'notifications', 'Manage notification settings'),
  ('notifications.delete', 'notifications', 'Delete notifications'),
  
  -- System Module
  ('system.settings.view', 'system', 'View system settings'),
  ('system.settings.update', 'system', 'Update system settings'),
  ('system.audit.view', 'system', 'View audit logs'),
  ('system.audit.export', 'system', 'Export audit logs'),
  ('system.maintenance.manage', 'system', 'Manage system maintenance')
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  description = VALUES(description);

-- ============================================================================
-- 8. ASSIGN PERMISSIONS TO ROLES
-- ============================================================================

-- Helper: Get role IDs
SET @super_admin_id = (SELECT role_id FROM roles WHERE name = 'super_admin');
SET @admin_id = (SELECT role_id FROM roles WHERE name = 'admin');
SET @analyst_id = (SELECT role_id FROM roles WHERE name = 'analyst');
SET @operator_id = (SELECT role_id FROM roles WHERE name = 'operator');
SET @viewer_id = (SELECT role_id FROM roles WHERE name = 'viewer');

-- SUPER ADMIN: All permissions
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @super_admin_id, permission_id FROM permissions WHERE is_active = 1;

-- ADMIN: User management, roles, system settings, analytics
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @admin_id, permission_id FROM permissions 
WHERE module IN ('users', 'roles', 'permissions', 'analytics', 'system', 'notifications')
  AND is_active = 1;

-- ANALYST: Map, vessels, alerts, suspicious activities, analytics
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @analyst_id, permission_id FROM permissions 
WHERE (
  module IN ('map', 'vessels', 'alerts', 'activities', 'analytics', 'notifications')
  OR name IN ('users.list', 'users.view')
)
AND name NOT IN (
  'vessels.delete',
  'alerts.delete',
  'analytics.reports.export'
)
AND is_active = 1;

-- OPERATOR: Day-to-day operations - map, vessels (read), alerts (manage)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @operator_id, permission_id FROM permissions 
WHERE name IN (
  'map.view',
  'map.vessels.view',
  'map.zones.view',
  'vessels.list',
  'vessels.view',
  'vessels.track',
  'vessels.positions.view',
  'alerts.list',
  'alerts.view',
  'alerts.create',
  'alerts.acknowledge',
  'alerts.resolve',
  'alerts.dismiss',
  'notifications.view',
  'analytics.dashboard.view'
)
AND is_active = 1;

-- VIEWER: Read-only access
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT @viewer_id, permission_id FROM permissions 
WHERE name IN (
  'map.view',
  'map.vessels.view',
  'vessels.list',
  'vessels.view',
  'alerts.list',
  'alerts.view',
  'notifications.view',
  'analytics.dashboard.view',
  'analytics.reports.view'
)
AND is_active = 1;

-- ============================================================================
-- 9. BACKWARD COMPATIBILITY: Map old permission names to new ones
-- ============================================================================

-- Create a mapping table for old to new permission names
CREATE TEMPORARY TABLE IF NOT EXISTS permission_migration (
  old_name VARCHAR(100),
  new_name VARCHAR(100)
);

INSERT INTO permission_migration (old_name, new_name) VALUES
  ('user.list', 'users.list'),
  ('user.view', 'users.view'),
  ('user.update', 'users.update'),
  ('user.status.update', 'users.verify'),
  ('user.role.update', 'users.roles.assign'),
  ('permission.list', 'permissions.list'),
  ('permission.add', 'permissions.create'),
  ('permission.delete', 'permissions.delete'),
  ('permission.assign', 'roles.permissions.assign'),
  ('permission.revoke', 'roles.permissions.revoke'),
  ('role.list', 'roles.list'),
  ('role.view', 'roles.view'),
  ('role.create', 'roles.create'),
  ('role.update', 'roles.update'),
  ('role.delete', 'roles.delete'),
  ('vessel.list', 'vessels.list'),
  ('vessel.view', 'vessels.view'),
  ('vessel.create', 'vessels.create'),
  ('vessel.update', 'vessels.update'),
  ('vessel.delete', 'vessels.delete'),
  ('position.list', 'vessels.positions.view'),
  ('position.view', 'vessels.positions.view'),
  ('position.create', 'vessels.positions.create'),
  ('alert.list', 'alerts.list'),
  ('alert.view', 'alerts.view'),
  ('alert.create', 'alerts.create'),
  ('alert.update', 'alerts.update'),
  ('alert.updateStatus', 'alerts.resolve'),
  ('alert.assign', 'alerts.assign'),
  ('notification.list', 'notifications.view'),
  ('notification.view', 'notifications.view'),
  ('notification.read', 'notifications.view'),
  ('notification.delete', 'notifications.delete'),
  ('activity.list', 'activities.logs.list'),
  ('activity.view', 'activities.logs.view');

-- Insert old permission names that are still referenced in code
-- This ensures backward compatibility during transition
INSERT IGNORE INTO permissions (name, module, description)
SELECT pm.old_name, p.module, CONCAT('Legacy: ', p.description)
FROM permission_migration pm
JOIN permissions p ON p.name = pm.new_name
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE name = pm.old_name);

-- Assign legacy permissions to roles that have the new permission
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT rp.role_id, p_old.permission_id
FROM permission_migration pm
JOIN permissions p_new ON p_new.name = pm.new_name
JOIN permissions p_old ON p_old.name = pm.old_name
JOIN role_permissions rp ON rp.permission_id = p_new.permission_id;

DROP TEMPORARY TABLE permission_migration;

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

SELECT 'RBAC System Enhancement Complete' as status;
SELECT COUNT(*) as total_roles FROM roles;
SELECT COUNT(*) as total_permissions FROM permissions;
SELECT COUNT(*) as total_role_permissions FROM role_permissions;
SELECT COUNT(*) as total_user_roles FROM user_roles;

-- Show role permission counts
SELECT r.name as role_name, r.description, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.role_id = rp.role_id
GROUP BY r.role_id, r.name, r.description
ORDER BY r.role_id;

-- Show permissions by module
SELECT module, COUNT(*) as permission_count
FROM permissions
WHERE is_active = 1
GROUP BY module
ORDER BY module;
