import { useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';

/**
 * Custom hook for permission-based access control
 * 
 * @example
 * // Check single permission
 * const { can } = usePermission();
 * if (can('users.create')) { ... }
 * 
 * @example
 * // Check multiple permissions (OR)
 * const { canAny } = usePermission();
 * if (canAny(['users.create', 'users.update'])) { ... }
 * 
 * @example
 * // Check multiple permissions (AND)
 * const { canAll } = usePermission();
 * if (canAll(['users.view', 'users.update'])) { ... }
 * 
 * @returns {Object} Permission checking functions
 */
export function usePermission() {
  const { 
    permissions, 
    roles, 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions,
    hasRole,
    isSuperAdmin
  } = useAuth();

  /**
   * Check if user can perform an action (has permission)
   * @param {string} permission - Permission name
   * @returns {boolean}
   */
  const can = useCallback((permission) => {
    return hasPermission(permission);
  }, [hasPermission]);

  /**
   * Check if user cannot perform an action (lacks permission)
   * @param {string} permission - Permission name
   * @returns {boolean}
   */
  const cannot = useCallback((permission) => {
    return !hasPermission(permission);
  }, [hasPermission]);

  /**
   * Check if user has any of the permissions (OR logic)
   * @param {string[]} permissionList - Array of permission names
   * @returns {boolean}
   */
  const canAny = useCallback((permissionList) => {
    return hasAnyPermission(permissionList);
  }, [hasAnyPermission]);

  /**
   * Check if user has all permissions (AND logic)
   * @param {string[]} permissionList - Array of permission names
   * @returns {boolean}
   */
  const canAll = useCallback((permissionList) => {
    return hasAllPermissions(permissionList);
  }, [hasAllPermissions]);

  /**
   * Get permissions for a specific module
   * @param {string} moduleName - Module name (e.g., 'users', 'vessels')
   * @returns {string[]} Array of permission names for the module
   */
  const getModulePermissions = useCallback((moduleName) => {
    return permissions.filter(p => p.startsWith(`${moduleName}.`));
  }, [permissions]);

  /**
   * Check if user has any permission for a module
   * @param {string} moduleName - Module name
   * @returns {boolean}
   */
  const canAccessModule = useCallback((moduleName) => {
    if (isSuperAdmin()) return true;
    return permissions.some(p => p.startsWith(`${moduleName}.`));
  }, [permissions, isSuperAdmin]);

  return {
    permissions,
    roles,
    can,
    cannot,
    canAny,
    canAll,
    hasRole,
    isSuperAdmin,
    getModulePermissions,
    canAccessModule,
  };
}

export default usePermission;
