export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(message = 'Resource not found') {
  return new AppError(404, message);
}

export function badRequest(message = 'Bad request', details) {
  return new AppError(400, message, details);
}

export function unauthorized(message = 'Unauthorized') {
  return new AppError(401, message);
}

export function forbidden(message = 'Forbidden') {
  return new AppError(403, message);
}

export function conflict(message = 'Conflict') {
  return new AppError(409, message);
}

export function serverError(message = 'Internal server error') {
  return new AppError(500, message);
}
