import { forbidden } from '../utils/errorHandler.js';
import { query } from '../config/db.config.js';
import { env } from '../config/env.js';

export function permissionMiddleware(requiredPermission) {
  return async function (req, res, next) {
    try {
      // Bypass permission checks in development environment
      if (env.nodeEnv === 'development') {
        return next();
      }

      const userId = req.user?.user_id;
      if (!userId) return next(forbidden('No user'));
      const sql = `SELECT 1
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        JOIN role_permissions rp ON rp.role_id = r.role_id
        JOIN permissions p ON p.permission_id = rp.permission_id
        WHERE u.user_id = ? AND p.name = ? LIMIT 1`;
      const rows = await query(sql, [userId, requiredPermission]);
      if (rows.length === 0) return next(forbidden('Insufficient permission'));
      next();
    } catch (e) {
      next(e);
    }
  };
}
