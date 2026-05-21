const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");

const DailyRotateFile = require("winston-daily-rotate-file");

const logsDir = path.join(process.cwd(), "logs");

// Keep the runtime log directory available without asking callers to manage it.
fs.mkdirSync(logsDir, { recursive: true });

const consoleFormat = format.printf(({ timestamp, level, message, ...meta }) => {
  const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} ${level}: ${message}${extra}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: {
    error: 0,
    warn: 1,
    info: 2,
  },
   // Main format for file transports (JSON)
   format: format.combine(
     format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
     format.errors({ stack: true }),
     format.json()
   ),
   transports: [
     new DailyRotateFile({
       filename: path.join(logsDir, "error-%DATE%.log"),
       datePattern: "YYYY-MM-DD",
       level: "error",
       maxSize: "20m",
       maxDays: "14d",
       auditFile: path.join(logsDir, ".audit-error.json"),
       format: format.combine(
         format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
         format.errors({ stack: true }),
         format.json()
       ),
     }),
     new DailyRotateFile({
       filename: path.join(logsDir, "combined-%DATE%.log"),
       datePattern: "YYYY-MM-DD",
       maxSize: "20m",
       maxDays: "30d",
       auditFile: path.join(logsDir, ".audit-combined.json"),
       format: format.combine(
         format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
         format.errors({ stack: true }),
         format.json()
       ),
     }),
     new transports.Console({
       level: process.env.NODE_ENV === "production" ? "info" : "debug",
       format: format.combine(
         format.colorize(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
         consoleFormat
  ),
     }),
  ],
  exitOnError: false,
});

// Placeholder for external error tracking (Sentry, etc.).
logger.captureException = function captureException(error, context = {}) {
  logger.error({ error, ...context }, "External error tracker placeholder");
};

module.exports = logger;
