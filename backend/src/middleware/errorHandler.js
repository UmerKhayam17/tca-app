const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const payload = {
    success: false,
    message,
    ...(err.details && { details: err.details }),
  };

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFoundHandler };
