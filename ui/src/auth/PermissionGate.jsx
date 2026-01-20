import { usePermission } from './usePermission.js';

/**
 * Conditional rendering component based on permissions
 * Use this to show/hide UI elements (buttons, tabs, menu items) based on user permissions
 * 
 * @example
 * // Show button only if user can create users
 * <PermissionGate permission="users.create">
 *   <button>Create User</button>
 * </PermissionGate>
 * 
 * @example
 * // With fallback UI for users without permission
 * <PermissionGate 
 *   permission="vessels.delete" 
 *   fallback={<span>No delete access</span>}
 * >
 *   <button>Delete Vessel</button>
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (OR - show if user has any)
 * <PermissionGate permissions={['alerts.acknowledge', 'alerts.resolve']}>
 *   <AlertActionsPanel />
 * </PermissionGate>
 * 
 * @example
 * // Multiple permissions (AND - show only if user has all)
 * <PermissionGate permissions={['users.view', 'users.update']} requireAll>
 *   <UserEditForm />
 * </PermissionGate>
 * 
 * @example
 * // Module-level access
 * <PermissionGate module="analytics">
 *   <AnalyticsDashboard />
 * </PermissionGate>
 * 
 * @example
 * // Role-based check
 * <PermissionGate role="admin">
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * @example
 * // Super admin only
 * <PermissionGate superAdminOnly>
 *   <SystemSettings />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  module,
  role,
  superAdminOnly = false,
  requireAll = false,
  fallback = null,
}) {
  const { can, canAny, canAll, canAccessModule, hasRole, isSuperAdmin } = usePermission();

  let hasAccess = false;

  // Check for super admin only access
  if (superAdminOnly) {
    hasAccess = isSuperAdmin();
  }
  // Check role
  else if (role) {
    hasAccess = hasRole(role) || isSuperAdmin();
  }
  // Check module-level access
  else if (module) {
    hasAccess = canAccessModule(module);
  }
  // Check single permission
  else if (permission) {
    hasAccess = can(permission);
  }
  // Check multiple permissions
  else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? canAll(permissions) 
      : canAny(permissions);
  }
  // No permission specified = allow access
  else {
    hasAccess = true;
  }

  if (!hasAccess) {
    return fallback;
  }

  return children;
}

/**
 * Helper component to hide content from users with a specific permission
 * Inverse of PermissionGate
 * 
 * @example
 * <HideFromPermission permission="admin.view">
 *   <SimplifiedUI />
 * </HideFromPermission>
 */
export function HideFromPermission({
  children,
  permission,
  permissions,
  requireAll = false,
}) {
  const { can, canAny, canAll } = usePermission();

  let hasPermission = false;

  if (permission) {
    hasPermission = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasPermission = requireAll 
      ? canAll(permissions) 
      : canAny(permissions);
  }

  // Hide if user HAS the permission
  if (hasPermission) {
    return null;
  }

  return children;
}

export default PermissionGate;
