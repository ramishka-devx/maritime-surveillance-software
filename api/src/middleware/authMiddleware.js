import { verifyToken } from '../utils/jwtHelper.js';
import { unauthorized } from '../utils/errorHandler.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next(unauthorized('No token provided'));
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (e) {
    next(unauthorized('Invalid token'));
  }
}
