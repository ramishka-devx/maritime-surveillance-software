import { forbidden } from '../utils/errorHandler.js';
import { env } from '../config/env.js';
import { 
  userHasPermission, 
  userHasAnyPermission, 
  isSuperAdmin 
} from '../utils/permissionHelper.js';

/**
 * Authorization Middleware
 * 
 * Checks if the authenticated user has the required permission(s) to access a route.
 * 
 * Usage:
 *   Single permission:
 *     router.get('/users', authMiddleware, authorize('users.list'), controller.list);
 * 
 *   Multiple permissions (OR logic - user needs ANY of them):
 *     router.get('/reports', authMiddleware, authorize(['analytics.reports.view', 'analytics.dashboard.view']), controller.view);
 * 
 *   Multiple permissions (AND logic - user needs ALL of them):
 *     router.post('/admin', authMiddleware, authorize(['users.create', 'roles.assign'], { requireAll: true }), controller.create);
 * 
 * @param {string|string[]} requiredPermission - Single permission or array of permissions
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireAll - If true, user must have ALL permissions (AND logic). Default: false (OR logic)
 * @returns {Function} Express middleware
 */
export function permissionMiddleware(requiredPermission, options = {}) {
  const { requireAll = false } = options;
  
  return async function (req, res, next) {
    try {
      // Optional bypass for local dev only (explicit opt-in)
      if (env.nodeEnv === 'development' && env.permissionsBypass) {
        return next();
      }

      const userId = req.user?.user_id;
      if (!userId) return next(forbidden('Authentication required'));

      // Super admin bypass - they have all permissions
      const isAdmin = await isSuperAdmin(userId);
      if (isAdmin) {
        req.isSuperAdmin = true;
        return next();
      }

      // Normalize to array
      const permissions = Array.isArray(requiredPermission) 
        ? requiredPermission 
        : [requiredPermission];

      let hasAccess = false;

      if (requireAll) {
        // AND logic: User must have ALL permissions
        const checks = await Promise.all(
          permissions.map(perm => userHasPermission(userId, perm))
        );
        hasAccess = checks.every(Boolean);
      } else {
        // OR logic: User needs ANY of the permissions
        hasAccess = await userHasAnyPermission(userId, permissions);
      }

      if (!hasAccess) {
        const permList = permissions.join(', ');
        const logic = requireAll ? 'all of' : 'one of';
        return next(forbidden(`Insufficient permission. Required ${logic}: ${permList}`));
      }

      // Store checked permission for activity logging
      req.checkedPermission = permissions[0];
      next();
    } catch (e) {
      next(e);
    }
  };
}

/**
 * Alias for permissionMiddleware for semantic clarity
 * Use this in route definitions for better readability
 */
export const authorize = permissionMiddleware;

/**
 * Middleware to require ALL specified permissions (AND logic)
 * 
 * @param {string[]} permissions - Array of required permissions
 * @returns {Function} Express middleware
 */
export function requireAllPermissions(permissions) {
  return permissionMiddleware(permissions, { requireAll: true });
}

/**
 * Middleware to require ANY of the specified permissions (OR logic)
 * 
 * @param {string[]} permissions - Array of permissions (user needs any one)
 * @returns {Function} Express middleware
 */
export function requireAnyPermission(permissions) {
  return permissionMiddleware(permissions, { requireAll: false });
}

export default permissionMiddleware;
