const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file is too large. Maximum size is 5 MB.';
    } else {
      message = err.message || 'File upload failed';
    }
  }

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
