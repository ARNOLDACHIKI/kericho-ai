const logger = require("../utils/logger");

// Logs inbound requests and their terminal status without exposing body payloads.
function requestLogger(req, res, next) {
  const startedAt = Date.now();
  const { method, originalUrl } = req;

  logger.info({ method, url: originalUrl }, "Incoming request");

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    logger.info(
      {
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        durationMs,
      },
      "Request completed"
    );
  });

  next();
}

module.exports = requestLogger;
