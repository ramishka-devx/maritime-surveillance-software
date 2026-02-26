import { query } from '../config/db.config.js';
import { NotificationService } from '../modules/notifications/notification.service.js';

function pick(obj, keys) {
  const out = {};
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) out[key] = obj[key];
  }
  return out;
}

function safeDetails(value) {
  if (!value || typeof value !== 'object') return null;
  // Ensure JSON-serializable and avoid logging large or sensitive payloads.
  try {
    const json = JSON.stringify(value);
    if (json.length > 4000) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function activityLogger(requiredPermissionName, options = {}) {
  return async (req, res, next) => {
    res.on('finish', async () => {
      try {
        if (!req.user?.user_id) return;

        let details = null;
        if (typeof options.details === 'function') {
          details = safeDetails(options.details(req, res));
        } else if (options.details && typeof options.details === 'object') {
          details = safeDetails(options.details);
        }

        // Provide safe defaults for common activity types when no explicit builder is supplied.
        if (!details && requiredPermissionName === 'permissions.request_access') {
          details = safeDetails(pick(req.body, ['permission', 'reason']));
        }
        if (!details && requiredPermissionName?.startsWith('alerts.')) {
          details = safeDetails({ alert_id: req.params?.alert_id, ...pick(req.body, ['status', 'assigned_to']) });
        }
        if (!details && requiredPermissionName?.startsWith('users.')) {
          details = safeDetails({ user_id: req.params?.user_id, ...pick(req.body, ['role_id', 'permission_id']) });
        }
        if (!details && requiredPermissionName?.startsWith('vessels.positions.')) {
          details = safeDetails({ vessel_id: req.params?.vessel_id });
        }
        if (!details && requiredPermissionName?.startsWith('vessels.')) {
          details = safeDetails({ vessel_id: req.params?.vessel_id });
        }

        // Resolve permission id by name
        const perms = await query('SELECT permission_id FROM permissions WHERE name = ? LIMIT 1', [requiredPermissionName]);
        const permission_id = perms[0]?.permission_id || null;

        // Insert with details if schema supports it; fall back silently to legacy insert.
        try {
          await query(
            'INSERT INTO activities (user_id, permission_id, method, path, status_code, details, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [req.user.user_id, permission_id, req.method, req.originalUrl, res.statusCode, details]
          );
        } catch {
          await query(
            'INSERT INTO activities (user_id, permission_id, method, path, status_code, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [req.user.user_id, permission_id, req.method, req.originalUrl, res.statusCode]
          );
        }

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
