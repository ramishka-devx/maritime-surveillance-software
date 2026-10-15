/**
 * Role constants for the RBAC system
 * These match the database role definitions
 */
export const Roles = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ANALYST: 'analyst',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
};

/**
 * Role IDs for direct comparison (match database IDs)
 */
export const RoleIds = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  ANALYST: 3,
  OPERATOR: 4,
  VIEWER: 5,
};

/**
 * Permission modules in the system
 */
export const PermissionModules = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  ANALYTICS: 'analytics',
  MAP: 'map',
  VESSELS: 'vessels',
  ALERTS: 'alerts',
  ACTIVITIES: 'activities',
  NOTIFICATIONS: 'notifications',
  SYSTEM: 'system',
};

/**
 * Common permission names for easy reference
 */
export const Permissions = {
  // Users
  USERS_LIST: 'users.list',
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',
  USERS_ROLES_ASSIGN: 'users.roles.assign',
  USERS_ROLES_REVOKE: 'users.roles.revoke',
  
  // Roles
  ROLES_LIST: 'roles.list',
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',
  ROLES_PERMISSIONS_ASSIGN: 'roles.permissions.assign',
  ROLES_PERMISSIONS_REVOKE: 'roles.permissions.revoke',
  
  // Vessels
  VESSELS_LIST: 'vessels.list',
  VESSELS_VIEW: 'vessels.view',
  VESSELS_CREATE: 'vessels.create',
  VESSELS_UPDATE: 'vessels.update',
  VESSELS_DELETE: 'vessels.delete',
  VESSELS_TRACK: 'vessels.track',
  VESSELS_POSITIONS_LIST: 'vessels.positions.list',
  VESSELS_POSITIONS_CREATE: 'vessels.positions.create',
  
  // Map
  MAP_VIEW: 'map.view',
  MAP_LAYERS_TOGGLE: 'map.layers.toggle',
  MAP_ZONES_VIEW: 'map.zones.view',
  MAP_ZONES_CREATE: 'map.zones.create',
  MAP_ZONES_UPDATE: 'map.zones.update',
  MAP_ZONES_DELETE: 'map.zones.delete',
  
  // Alerts
  ALERTS_LIST: 'alerts.list',
  ALERTS_VIEW: 'alerts.view',
  ALERTS_CREATE: 'alerts.create',
  ALERTS_UPDATE: 'alerts.update',
  ALERTS_DELETE: 'alerts.delete',
  ALERTS_ACKNOWLEDGE: 'alerts.acknowledge',
  ALERTS_RESOLVE: 'alerts.resolve',
  ALERTS_DISMISS: 'alerts.dismiss',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_REPORTS_GENERATE: 'analytics.reports.generate',
  ANALYTICS_REPORTS_EXPORT: 'analytics.reports.export',
  ANALYTICS_DASHBOARD_VIEW: 'analytics.dashboard.view',
  
  // Activities
  ACTIVITIES_LIST: 'activities.list',
  ACTIVITIES_VIEW: 'activities.view',
  ACTIVITIES_CREATE: 'activities.create',
  ACTIVITIES_UPDATE: 'activities.update',
  ACTIVITIES_DELETE: 'activities.delete',
  
  // Notifications
  NOTIFICATIONS_LIST: 'notifications.list',
  NOTIFICATIONS_SEND: 'notifications.send',
  NOTIFICATIONS_SETTINGS: 'notifications.settings',
  
  // System
  SYSTEM_SETTINGS_VIEW: 'system.settings.view',
  SYSTEM_SETTINGS_UPDATE: 'system.settings.update',
  SYSTEM_LOGS_VIEW: 'system.logs.view',
  SYSTEM_BACKUP: 'system.backup',
  SYSTEM_MAINTENANCE: 'system.maintenance',
};

/**
 * Normalize role string for comparison
 * @param {string} role - Role name
 * @returns {string} Normalized role name
 */
export function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

/**
 * Check if user has operator role
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isOperator(user) {
  if (!user) return false;
  // Check roles array (new multi-role system)
  if (user.roles?.some(r => normalizeRole(r.name) === Roles.OPERATOR)) return true;
  // Check legacy single role
  if (normalizeRole(user?.role) === Roles.OPERATOR) return true;
  return Number(user?.role_id) === RoleIds.OPERATOR;
}

/**
 * Check if user has super admin role
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isSuperAdmin(user) {
  if (!user) return false;
  // Check roles array (new multi-role system)
  if (user.roles?.some(r => normalizeRole(r.name) === Roles.SUPER_ADMIN || r.role_id === RoleIds.SUPER_ADMIN)) return true;
  // Check legacy single role
  if (normalizeRole(user?.role) === Roles.SUPER_ADMIN) return true;
  return Number(user?.role_id) === RoleIds.SUPER_ADMIN;
}

/**
 * Check if user has admin role
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAdmin(user) {
  if (!user) return false;
  if (isSuperAdmin(user)) return true; // Super admin is also admin
  // Check roles array (new multi-role system)
  if (user.roles?.some(r => normalizeRole(r.name) === Roles.ADMIN)) return true;
  // Check legacy single role
  if (normalizeRole(user?.role) === Roles.ADMIN) return true;
  return Number(user?.role_id) === RoleIds.ADMIN;
}

/**
 * Check if user has analyst role
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAnalyst(user) {
  if (!user) return false;
  // Check roles array (new multi-role system)
  if (user.roles?.some(r => normalizeRole(r.name) === Roles.ANALYST)) return true;
  // Check legacy single role
  if (normalizeRole(user?.role) === Roles.ANALYST) return true;
  return Number(user?.role_id) === RoleIds.ANALYST;
}

/**
 * Check if user has viewer role
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isViewer(user) {
  if (!user) return false;
  // Check roles array (new multi-role system)
  if (user.roles?.some(r => normalizeRole(r.name) === Roles.VIEWER)) return true;
  // Check legacy single role
  if (normalizeRole(user?.role) === Roles.VIEWER) return true;
  return Number(user?.role_id) === RoleIds.VIEWER;
}

/**
 * Check if user has any of the specified roles
 * @param {Object} user - User object
 * @param {string[]} roleNames - Array of role names to check
 * @returns {boolean}
 */
export function hasAnyRole(user, roleNames) {
  if (!user) return false;
  if (isSuperAdmin(user)) return true; // Super admin has all roles
  
  const normalizedRoles = roleNames.map(normalizeRole);
  
  // Check roles array (new multi-role system)
  if (user.roles?.some(r => normalizedRoles.includes(normalizeRole(r.name)))) return true;
  
  // Check legacy single role
  return normalizedRoles.includes(normalizeRole(user?.role));
}

/**
 * Get all role names for a user
 * @param {Object} user - User object
 * @returns {string[]} Array of role names
 */
export function getUserRoles(user) {
  if (!user) return [];
  
  // New multi-role system
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.map(r => r.name || r);
  }
  
  // Legacy single role
  if (user.role) {
    return [user.role];
  }
  
  return [];
}

