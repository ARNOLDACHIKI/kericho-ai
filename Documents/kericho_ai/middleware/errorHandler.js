const logger = require("../utils/logger");

const SAFE_ERROR_MESSAGE = "Something went wrong. Please try again later.";

// Centralized error handler. Avoids leaking stack traces or internal details.
function errorHandler(err, _req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // Placeholder for Sentry or similar external monitoring.
  logger.captureException(err, {
    route: _req.originalUrl,
    method: _req.method,
  });

  logger.error(
    {
      message: err?.message,
      stack: err?.stack,
      route: _req.originalUrl,
      method: _req.method,
    },
    "Unhandled application error"
  );

  const statusCode = Number(err?.statusCode || err?.status || 500);
  return res.status(statusCode).json({
    success: false,
    error: SAFE_ERROR_MESSAGE,
  });
}

module.exports = errorHandler;
