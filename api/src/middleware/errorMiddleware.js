import { AppError } from '../utils/errorHandler.js';
import { logger } from '../config/logger.js';

export function errorMiddleware(err, req, res, next) {
  const status = err instanceof AppError && err.statusCode ? err.statusCode : 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) {
    logger.error({ err, sql: err?.query, params: err?.params }, message);
  } else {
    logger.warn({ err, sql: err?.query, params: err?.params }, message);
  }

  res.status(status).json({ success: false, message, details: err.details });
}
