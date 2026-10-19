import { verifyToken } from '../utils/jwtHelper.js';
import { unauthorized, forbidden } from '../utils/errorHandler.js';
import { isMaintenance } from '../utils/permissionHelper.js';
import { canMaintenanceAccess, isSystemHealthApi } from '../utils/maintenanceAccess.js';

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next(unauthorized('No token provided'));
  try {
    const payload = verifyToken(token);
    req.user = payload;
  } catch (e) {
    return next(unauthorized('Invalid token'));
  }
  try {
    req.isMaintenance = await isMaintenance(req.user.user_id);
    if (!req.isMaintenance && isSystemHealthApi(req.originalUrl)) {
      return next(forbidden('System Health is restricted to Maintenance'));
    }
    if (req.isMaintenance && !canMaintenanceAccess(req.method, req.originalUrl)) {
      return next(forbidden('Maintenance can only access System Health'));
    }
    next();
  } catch (error) {
    next(error);
  }
}
