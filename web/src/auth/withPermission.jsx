import { usePermission } from './usePermission.js';

/**
 * Higher Order Component (HOC) for permission-based access control
 * Wraps any component and controls visibility based on required permissions
 * 
 * @example
 * // Basic usage with Button
 * const ProtectedButton = withPermission(Button);
 * <ProtectedButton requiredPermission="users.create">Create User</ProtectedButton>
 * 
 * @example
 * // With multiple permissions (OR logic)
 * <ProtectedButton requiredPermissions={['users.create', 'users.update']}>
 *   Modify User
 * </ProtectedButton>
 * 
 * @example
 * // With multiple permissions (AND logic)
 * <ProtectedButton requiredPermissions={['users.view', 'users.delete']} requireAll>
 *   Delete User
 * </ProtectedButton>
 * 
 * @example
 * // With role check
 * <ProtectedInput requiredRole="admin" />
 * 
 * @example
 * // With fallback UI
 * <ProtectedButton 
 *   requiredPermission="admin.access" 
 *   fallback={<span>No access</span>}
 * >
 *   Admin Panel
 * </ProtectedButton>
 * 
 * @param {React.Component} Component - The component to wrap
 * @returns {React.Component} - The wrapped component with permission checks
 */
export function withPermission(Component) {
  function PermissionWrapper({
    requiredPermission,
    requiredPermissions,
    requiredRole,
    superAdminOnly = false,
    requireAll = false,
    fallback = null,
    ...props
  }) {
    const { can, canAny, canAll, hasRole, isSuperAdmin } = usePermission();

    let hasAccess = false;

    // Check for super admin only access
    if (superAdminOnly) {
      hasAccess = isSuperAdmin();
    }
    // Check role
    else if (requiredRole) {
      hasAccess = hasRole(requiredRole) || isSuperAdmin();
    }
    // Check single permission
    else if (requiredPermission) {
      hasAccess = can(requiredPermission);
    }
    // Check multiple permissions
    else if (requiredPermissions && requiredPermissions.length > 0) {
      hasAccess = requireAll 
        ? canAll(requiredPermissions) 
        : canAny(requiredPermissions);
    }
    // No permission specified = allow access
    else {
      hasAccess = true;
    }

    // If user doesn't have access, render fallback or nothing
    if (!hasAccess) {
      return fallback;
    }

    // Render the wrapped component with all props
    return <Component {...props} />;
  }

  // Set display name for debugging
  PermissionWrapper.displayName = `withPermission(${Component.displayName || Component.name || 'Component'})`;

  return PermissionWrapper;
}

export default withPermission;
