const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

const rateLimitMessage = {
  success: false,
  error: "Too many requests. Please try again later.",
};

function buildLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    // CRITICAL: Skip webhook paths from rate limiting
    // Meta does not retry intelligently, so 429 would cause webhook delivery to fail
    skip: (req) => {
      const path = req.path || req.originalUrl || "";
      const isWebhook = path === "/webhook" || path.startsWith("/webhook/");
      if (isWebhook) {
        console.log("[RATE_LIMITER] SKIP webhook path:", path);
      }
      return isWebhook;
    },
  });
}

const globalRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: rateLimitMessage,
});

const sensitiveRateLimiter = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: rateLimitMessage,
});

module.exports = {
  globalRateLimiter,
  sensitiveRateLimiter,
};
