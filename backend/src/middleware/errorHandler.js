import { ApiError } from '../utils/apiError.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({
    success: false,
    message: error.statusCode ? error.message : 'An unexpected server error occurred.',
    ...(error.details ? { details: error.details } : {})
  });
}
