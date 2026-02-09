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

-- Add description column if not exists (safe approach)
SET @dbname = DATABASE();
SET @tablename = "roles";
SET @columnname = "description";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE roles ADD COLUMN description TEXT NULL AFTER name"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add is_system column
SET @columnname = "is_system";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE roles ADD COLUMN is_system TINYINT(1) NOT NULL DEFAULT 0 AFTER description"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add is_active column
SET @columnname = "is_active";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE roles ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER is_system"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add created_at column
SET @columnname = "created_at";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE roles ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add updated_at column
SET @columnname = "updated_at";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE roles ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- ============================================================================
-- 2. ENHANCE PERMISSIONS TABLE
-- ============================================================================

SET @tablename = "permissions";

-- Add module column
SET @columnname = "module";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE permissions ADD COLUMN module VARCHAR(50) NULL AFTER name"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add is_active column
SET @columnname = "is_active";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE permissions ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER description"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add created_at column
SET @columnname = "created_at";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (column_name = @columnname)) > 0,
  "SELECT 1",
  "ALTER TABLE permissions ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index on module
SET @indexname = "idx_permissions_module";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE (table_name = @tablename) AND (table_schema = @dbname) AND (index_name = @indexname)) > 0,
  "SELECT 1",
  "CREATE INDEX idx_permissions_module ON permissions(module)"
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

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
-- 4. CREATE USER_PERMISSIONS TABLE (DIRECT PERMISSION ASSIGNMENTS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_permissions (
  user_id INT NOT NULL,
  permission_id INT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by INT NULL,
  PRIMARY KEY (user_id, permission_id),
  KEY idx_up_permission (permission_id),
  KEY idx_up_assigned_by (assigned_by),
  CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_up_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE,
  CONSTRAINT fk_up_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. MIGRATE EXISTING USER ROLES TO user_roles TABLE
-- ============================================================================

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT user_id, role_id 
FROM users 
WHERE role_id IS NOT NULL;

-- ============================================================================
-- 6. INSERT MISSING ROLES AND UPDATE DESCRIPTIONS
-- ============================================================================

-- Ensure all required roles exist (using different approach)
-- If role_id conflicts, MySQL will auto-increment
INSERT INTO roles (name) 
SELECT 'super_admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'super_admin');

INSERT INTO roles (name)
SELECT 'admin' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');

INSERT INTO roles (name)
SELECT 'analyst' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'analyst');

INSERT INTO roles (name)
SELECT 'operator' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'operator');

INSERT INTO roles (name)
SELECT 'viewer' WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'viewer');

-- Update role descriptions
UPDATE roles SET description = 'Full system access with all permissions', is_system = 1, is_active = 1 WHERE name = 'super_admin';
UPDATE roles SET description = 'Administrative access to manage users, roles, and system settings', is_system = 1, is_active = 1 WHERE name = 'admin';
UPDATE roles SET description = 'Analytics and reporting access for data analysis', is_system = 1, is_active = 1 WHERE name = 'analyst';
UPDATE roles SET description = 'Operational access for monitoring and managing maritime surveillance', is_system = 1, is_active = 1 WHERE name = 'operator';
UPDATE roles SET description = 'Read-only access to view maritime surveillance data', is_system = 1, is_active = 1 WHERE name = 'viewer';

-- ============================================================================
-- 7. UPDATE PERMISSIONS WITH MODULES AND NEW NAMING CONVENTION
-- ============================================================================

-- Delete old permissions to avoid conflicts
DELETE FROM role_permissions;
DELETE FROM permissions;

-- Insert permissions organized by module
INSERT INTO permissions (name, module, description) VALUES
-- Users Module
('users.list', 'users', 'View list of all users'),
('users.view', 'users', 'View user details'),
('users.create', 'users', 'Create new users'),
('users.update', 'users', 'Update user information'),
('users.delete', 'users', 'Delete users'),
('users.roles.view', 'users', 'View user role assignments'),
('users.roles.assign', 'users', 'Assign roles to users'),
('users.roles.revoke', 'users', 'Revoke roles from users'),
('users.permissions.view', 'users', 'View user permissions'),
('users.permissions.assign', 'users', 'Assign direct permissions to users'),
('users.permissions.revoke', 'users', 'Revoke direct permissions from users'),

-- Roles Module
('roles.list', 'roles', 'View list of all roles'),
('roles.view', 'roles', 'View role details'),
('roles.create', 'roles', 'Create new roles'),
('roles.update', 'roles', 'Update role information'),
('roles.delete', 'roles', 'Delete roles'),
('roles.permissions.view', 'roles', 'View role permissions'),
('roles.permissions.assign', 'roles', 'Assign permissions to roles'),
('roles.permissions.revoke', 'roles', 'Revoke permissions from roles'),
('roles.stats', 'roles', 'View role statistics'),

-- Permissions Module
('permissions.list', 'permissions', 'View list of all permissions'),
('permissions.create', 'permissions', 'Create new permissions'),
('permissions.update', 'permissions', 'Update permission information'),
('permissions.delete', 'permissions', 'Delete permissions'),

-- Analytics Module
('analytics.view', 'analytics', 'Access analytics dashboard'),
('analytics.reports.generate', 'analytics', 'Generate analytics reports'),
('analytics.reports.export', 'analytics', 'Export analytics reports'),
('analytics.dashboard.view', 'analytics', 'View comprehensive analytics dashboard'),
('analytics.trends.view', 'analytics', 'View trend analysis and patterns'),

-- Map Module
('map.view', 'map', 'View the maritime surveillance map'),
('map.layers.toggle', 'map', 'Toggle map layers on/off'),
('map.zones.view', 'map', 'View restricted/surveillance zones'),
('map.zones.create', 'map', 'Create new surveillance zones'),
('map.zones.update', 'map', 'Modify surveillance zones'),
('map.zones.delete', 'map', 'Delete surveillance zones'),
('map.fullscreen', 'map', 'Access fullscreen map view'),

-- Vessels Module
('vessels.list', 'vessels', 'View list of all vessels'),
('vessels.view', 'vessels', 'View vessel details'),
('vessels.create', 'vessels', 'Add new vessels to database'),
('vessels.update', 'vessels', 'Update vessel information'),
('vessels.delete', 'vessels', 'Delete vessels from database'),
('vessels.track', 'vessels', 'Track vessel movements in real-time'),
('vessels.search', 'vessels', 'Search for vessels'),
('vessels.positions.list', 'vessels', 'View vessel position history'),
('vessels.positions.create', 'vessels', 'Record vessel positions'),
('vessels.export', 'vessels', 'Export vessel data'),

-- Alerts Module
('alerts.list', 'alerts', 'View list of all alerts'),
('alerts.view', 'alerts', 'View alert details'),
('alerts.create', 'alerts', 'Create new alerts'),
('alerts.update', 'alerts', 'Update alert information'),
('alerts.delete', 'alerts', 'Delete alerts'),
('alerts.acknowledge', 'alerts', 'Acknowledge received alerts'),
('alerts.resolve', 'alerts', 'Mark alerts as resolved'),
('alerts.dismiss', 'alerts', 'Dismiss false-positive alerts'),
('alerts.export', 'alerts', 'Export alert data'),

-- Activities Module
('activities.list', 'activities', 'View activity logs'),
('activities.view', 'activities', 'View activity details'),
('activities.create', 'activities', 'Create activity entries'),
('activities.update', 'activities', 'Update activity information'),
('activities.delete', 'activities', 'Delete activity entries'),
('activities.search', 'activities', 'Search activity logs'),
('activities.export', 'activities', 'Export activity logs'),
('activities.audit', 'activities', 'View audit trail'),

-- Notifications Module
('notifications.list', 'notifications', 'View notifications'),
('notifications.send', 'notifications', 'Send notifications to users'),
('notifications.settings', 'notifications', 'Configure notification preferences'),

-- System Module
('system.settings.view', 'system', 'View system settings'),
('system.settings.update', 'system', 'Update system configuration'),
('system.logs.view', 'system', 'View system logs'),
('system.backup', 'system', 'Create system backups'),
('system.maintenance', 'system', 'Perform system maintenance tasks');

-- ============================================================================
-- 8. ASSIGN PERMISSIONS TO ROLES
-- ============================================================================

-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id 
FROM roles r, permissions p
WHERE r.name = 'super_admin';

-- Admin: Most permissions except system-critical ones
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id 
FROM roles r, permissions p
WHERE r.name = 'admin'
  AND p.name NOT IN ('system.maintenance', 'system.backup', 'permissions.delete', 'roles.delete');

-- Analyst: Analytics, viewing, and reporting
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'analyst'
  AND p.name IN (
    'analytics.view', 'analytics.reports.generate', 'analytics.reports.export', 
    'analytics.dashboard.view', 'analytics.trends.view',
    'map.view', 'map.layers.toggle', 'map.zones.view', 'map.fullscreen',
    'vessels.list', 'vessels.view', 'vessels.search', 'vessels.positions.list', 'vessels.export',
    'alerts.list', 'alerts.view', 'alerts.export',
    'activities.list', 'activities.view', 'activities.search', 'activities.export',
    'notifications.list'
  );

-- Operator: Operations and monitoring
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'operator'
  AND p.name IN (
    'map.view', 'map.layers.toggle', 'map.zones.view', 'map.fullscreen',
    'vessels.list', 'vessels.view', 'vessels.track', 'vessels.search', 'vessels.positions.list', 'vessels.positions.create',
    'alerts.list', 'alerts.view', 'alerts.create', 'alerts.acknowledge', 'alerts.resolve', 'alerts.dismiss',
    'activities.list', 'activities.view', 'activities.create',
    'notifications.list', 'notifications.send'
  );

-- Viewer: Read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r, permissions p
WHERE r.name = 'viewer'
  AND p.name IN (
    'map.view', 'map.layers.toggle',
    'vessels.list', 'vessels.view',
    'alerts.list', 'alerts.view',
    'activities.list', 'activities.view',
    'notifications.list'
  );

-- ============================================================================
-- RBAC Migration Complete
-- ============================================================================
