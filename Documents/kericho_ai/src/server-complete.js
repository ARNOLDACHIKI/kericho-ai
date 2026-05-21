/**
 * Main Server Entry Point
 * 
 * WhatsApp Healthcare Assistant Backend
 * Handles Express server setup, middleware, routes, and graceful shutdown
 * 
 * Environment: Node.js 20+
 * Database: PostgreSQL via Prisma
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const pinoHttp = require("pino-http");

// ============ Configuration ============
const env = require("./config/env");
const logger = require("./lib/logger");
const { connectDB, disconnectDB } = require("./lib/prisma");

// ============ Routes ============
const healthRoutes = require("./routes/healthRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

// ============ Express Setup ============
const app = express();
let server;

/**
 * Middleware Setup
 * 
 * Order matters:
 * 1. Security headers (helmet)
 * 2. CORS
 * 3. Body parsing
 * 4. HTTP logging
 */
app.use(helmet()); // Security headers
app.use(cors()); // Cross-origin requests
app.use(express.json({ limit: "1mb" })); // JSON parsing
app.use(pinoHttp({ logger })); // HTTP request logging

// ============ Routes ============

/**
 * Root endpoint - API info
 */
app.get("/", (_req, res) => {
  res.status(200).json({
    name: "Kericho Healthcare WhatsApp Assistant",
    description: "Educational healthcare information via WhatsApp",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/api/health",
      ready: "/api/ready",
      webhook: "/webhook",
    },
  });
});

// Health check routes
app.use("/api", healthRoutes);

// WhatsApp webhook routes
app.use("/", webhookRoutes);

/**
 * 404 Handler
 */
app.use((_req, res) => {
  res.status(404).json({
    error: "Not found",
    message: "The requested endpoint does not exist",
  });
});

/**
 * Global Error Handler
 * 
 * Catches all errors and returns proper JSON responses
 * Prevents server crashes
 */
app.use((err, _req, res, _next) => {
  logger.error({ err }, "Unhandled request error");

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    error: {
      status: statusCode,
      message,
      ...(env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
});

// ============ Bootstrap ============

/**
 * Initialize server and services
 * 
 * 1. Connect to database
 * 2. Start Express server
 * 3. Setup graceful shutdown handlers
 */
async function bootstrap() {
  try {
    // ---- Database Connection ----
    logger.info("Connecting to PostgreSQL...");
    await connectDB();
    logger.info("✅ PostgreSQL connected");

    // ---- Start Server ----
    server = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          environment: env.NODE_ENV,
          provider: env.WHATSAPP_PROVIDER,
        },
        "🚀 Server started successfully"
      );

      // Print useful info
      logger.info(`
╔════════════════════════════════════════╗
║   Kericho Healthcare Assistant API     ║
╠════════════════════════════════════════╣
║ Status: ✅ Running                     ║
║ Port: ${env.PORT}                            ║
║ Environment: ${env.NODE_ENV.padEnd(20)} ║
║ Webhook: POST /webhook                 ║
║ Health: GET /api/health                ║
╚════════════════════════════════════════╝
      `);
    });

    // ---- Graceful Shutdown ----
    setupGracefulShutdown();
  } catch (error) {
    logger.error({ error }, "❌ Failed to start server");
    process.exit(1);
  }
}

/**
 * Graceful Shutdown Handler
 * 
 * - Close Express server
 * - Disconnect database
 * - Close any open connections
 */
function setupGracefulShutdown() {
  const signals = ["SIGTERM", "SIGINT"];

  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      if (server) {
        server.close(async () => {
          try {
            await disconnectDB();
            logger.info("✅ All connections closed");
            process.exit(0);
          } catch (error) {
            logger.error({ error }, "Error during shutdown");
            process.exit(1);
          }
        });

        // Force shutdown after 10 seconds
        setTimeout(() => {
          logger.error("Forced shutdown - graceful shutdown timeout");
          process.exit(1);
        }, 10000);
      }
    });
  }
}

/**
 * Unhandled Exception Handler
 * 
 * Catches any uncaught errors
 */
process.on("uncaughtException", (error) => {
  logger.error({ error }, "❌ Uncaught Exception");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error({ reason, promise }, "❌ Unhandled Rejection");
  process.exit(1);
});

// ============ Start ============
bootstrap();

module.exports = app;
