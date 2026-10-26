import { Navigate, useLocation } from 'react-router-dom';
import { usePermission } from './usePermission.js';

/**
 * Route guard component that checks for required permissions
 * 
 * @example
 * // Single permission
 * <RequirePermission permission="users.list">
 *   <UsersPage />
 * </RequirePermission>
 * 
 * @example
 * // Multiple permissions (OR - any one is sufficient)
 * <RequirePermission permissions={['users.list', 'users.view']}>
 *   <UsersPage />
 * </RequirePermission>
 * 
 * @example
 * // Multiple permissions (AND - all required)
 * <RequirePermission permissions={['users.list', 'users.view']} requireAll>
 *   <UsersPage />
 * </RequirePermission>
 * 
 * @example
 * // Module-level access
 * <RequirePermission module="users">
 *   <UsersPage />
 * </RequirePermission>
 */
export function RequirePermission({
  children,
  permission,
  permissions,
  module,
  requireAll = false,
  fallback = null,
  redirectTo = '/dashboard',
}) {
  const { can, canAny, canAll, canAccessModule } = usePermission();
  const location = useLocation();

  let hasAccess = false;

  // Check module-level access
  if (module) {
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
    // If fallback provided, render it
    if (fallback) {
      return fallback;
    }
    // Otherwise redirect
    return <Navigate to={redirectTo} replace state={{ from: location, reason: 'permission_denied' }} />;
  }

  return children;
}

export default RequirePermission;
