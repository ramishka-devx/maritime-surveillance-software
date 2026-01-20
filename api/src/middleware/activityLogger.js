import { query } from '../config/db.config.js';
import { NotificationService } from '../modules/notifications/notification.service.js';

export function activityLogger(requiredPermissionName, options = {}) {
  return async (req, res, next) => {
    res.on('finish', async () => {
      try {
        if (!req.user?.user_id) return;
        // Resolve permission id by name
        const perms = await query('SELECT permission_id FROM permissions WHERE name = ? LIMIT 1', [requiredPermissionName]);
        const permission_id = perms[0]?.permission_id || null;
        await query(
          'INSERT INTO activities (user_id, permission_id, method, path, status_code, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [req.user.user_id, permission_id, req.method, req.originalUrl, res.statusCode]
        );

        // Create notification if specified
        if (options.createNotification) {
          const { userId, type, title, message, entityType, entityId, priority } = options.createNotification;
          await NotificationService.createNotification(
            userId || req.user.user_id,
            type || 'activity',
            title || `${requiredPermissionName} performed`,
            message || `Activity: ${req.method} ${req.originalUrl}`,
            entityType,
            entityId,
            priority
          );
        }
      } catch (_) {
        // swallow activity errors
      }
    });
    next();
  };
}
