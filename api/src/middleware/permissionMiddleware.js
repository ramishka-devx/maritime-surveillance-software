import { forbidden } from '../utils/errorHandler.js';
import { query } from '../config/db.config.js';
import { env } from '../config/env.js';

export function permissionMiddleware(requiredPermission) {
  return async function (req, res, next) {
    try {
      // Optional bypass for local dev only (explicit opt-in)
      if (env.nodeEnv === 'development' && env.permissionsBypass) {
        return next();
      }

      const userId = req.user?.user_id;
      if (!userId) return next(forbidden('No user'));

      // Super admin bypass (treat as allow-all)
      if (Number(req.user?.role_id) === 1) {
        return next();
      }

      const sql = `SELECT 1
        FROM users u
        JOIN roles r ON u.role_id = r.role_id
        JOIN role_permissions rp ON rp.role_id = r.role_id
        JOIN permissions p ON p.permission_id = rp.permission_id
        WHERE u.user_id = ? AND p.name = ? LIMIT 1`;
      const rows = await query(sql, [userId, requiredPermission]);
      if (rows.length === 0) return next(forbidden(`Insufficient permission: ${requiredPermission}`));
      next();
    } catch (e) {
      next(e);
    }
  };
}
