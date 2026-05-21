require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");

const env = require("./config/env");
const logger = require("./lib/logger");
const prisma = require("./lib/prisma");

// middleware
const requestLogger = require("../middleware/requestLogger");
const errorHandler = require("../middleware/errorHandler");
const { globalRateLimiter } = require("../middleware/rateLimiter");

// db + auth
const { connectDB, disconnectDB, isConnected } = require("./lib/prisma");
const { hashPassword } = require("../services/authService");

// routes
const healthRoutes = require("./routes/healthRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const adminRoutes = require("./routes/admin");
const authRoutes = require("./routes/auth");
const smsRoutes = require("./routes/sms");

// whatsapp services (ONLY KEEP SEND + PROCESSING)
const {
  sendMessage,
} = require("./services/whatsappService");

const {
  processIncomingMessage,
  getConversationHistory,
} = require("./services/conversationService");

const { normalizePhoneNumber } = require("./utils/phone");

// scheduler
const { startScheduler, stopScheduler } = require("../services/schedulerService");
const { processQueue } = require("../services/queueService");

const app = express();

const frontendDir = path.join(__dirname, "..", "frontend");
const evidenceTemplatePath = path.join(frontendDir, "evidence.html");

let server;
let queueProcessor;

function collectRoutes(stack, prefix = "") {
  const routes = [];

  for (const layer of stack || []) {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods || {});
      for (const method of methods) {
        routes.push({ method: method.toUpperCase(), path: `${prefix}${layer.route.path}`.replace(/\/+/g, "/") });
      }
      continue;
    }

    if (layer.name === "router" && layer.handle && Array.isArray(layer.handle.stack)) {
      routes.push(...collectRoutes(layer.handle.stack, prefix));
    }
  }

  return routes;
}

function logStartupEnvironment() {
  console.log(
    `[STARTUP] env=${env.NODE_ENV} port=${env.PORT} verifyTokenLoaded=${Boolean(env.WHATSAPP_VERIFY_TOKEN)} webhookMount=/webhook`
  );

  logger.info(
    {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      appBaseUrl: env.APP_BASE_URL,
      webhookPath: "/webhook",
      webhookMount: "/webhook",
      provider: env.WHATSAPP_PROVIDER,
      verifyTokenLoaded: Boolean(env.WHATSAPP_VERIFY_TOKEN),
      verifyTokenLength: env.WHATSAPP_VERIFY_TOKEN ? env.WHATSAPP_VERIFY_TOKEN.length : 0,
    },
    "Startup environment validated"
  );

  logger.info(
    {
      manualVerificationUrl:
        `${env.APP_BASE_URL || "http://localhost:3000"}/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(env.WHATSAPP_VERIFY_TOKEN)}&hub.challenge=12345`,
    },
    "Webhook verification example"
  );
}

function logRouteDiagnostics() {
  // Express mounts router.get("/") at the parent path, so /webhook + / = /webhook.
  const routerStack = app.router?.stack || app._router?.stack || [];
  const registeredRoutes = collectRoutes(routerStack);

  console.log(
    `[STARTUP] registered webhook routes: GET /webhook, POST /webhook`
  );

  logger.info(
    {
      activeEntrypoint: "src/index.js",
      webhookMount: "/webhook",
      webhookRoutesFile: "src/routes/webhookRoutes.js",
      mountedWebhookRoutes: ["GET /webhook", "POST /webhook"],
      registeredRoutes,
    },
    "Mounted webhook routes"
  );
}

/* ========================
   MIDDLEWARE ORDER
======================== */

app.use(helmet());
app.use(cors());

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(requestLogger);
app.use(globalRateLimiter);

app.use("/admin-ui", express.static(frontendDir, { redirect: false }));

app.use("/evidence", express.static(frontendDir, { redirect: false }));

/* ========================
   ROUTES
======================== */

app.use("/api", healthRoutes);

// ✅ SINGLE WEBHOOK ENTRY POINT (IMPORTANT FIX)
app.use("/webhook", webhookRoutes);

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/sms", smsRoutes);

app.get("/", (_req, res) => {
  res.status(200).send("AFYAEDUCATORBOT is live");
});

app.get("/admin-ui", (_req, res) => {
  res.redirect("/admin-ui/login.html");
});

function renderEvidencePage(res) {
  try {
    const template = fs.readFileSync(evidenceTemplatePath, "utf8");
    const html = template
      .replaceAll("__WEBHOOK_URL__", `${env.APP_BASE_URL || "http://localhost:3000"}/webhook`)
      .replaceAll("__VERIFY_TOKEN__", env.WHATSAPP_VERIFY_TOKEN || "")
      .replaceAll("__APP_BASE_URL__", env.APP_BASE_URL || "http://localhost:3000")
      .replaceAll("__BOT_NAME__", "AFYAEDUCATORBOT");

    res.status(200).type("text/html").send(html);
  } catch (error) {
    logger.error({ error: error.message }, "Failed to render evidence page");
    res.status(500).send("Unable to load evidence page");
  }
}

app.get("/evidence", (_req, res) => renderEvidencePage(res));
app.get("/evidence/", (_req, res) => renderEvidencePage(res));

/* ========================
   QR (Baileys disabled logic kept safe)
======================== */

app.get("/qr", (req, res) => {
  return res.status(200).json({
    message: "QR mode disabled (Meta webhook active)",
  });
});

/* ========================
   CHAT HISTORY
======================== */

app.get("/api/chat/:phoneNumber", async (req, res) => {
  try {
    const { phoneNumber } = req.params;
    const normalized = normalizePhoneNumber(phoneNumber);

    const { user, messages } = await getConversationHistory(normalized, 10);

    res.status(200).json({
      phone: normalized,
      user,
      messages,
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch chat history");
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

/* ========================
   ERROR HANDLER
======================== */

app.use(errorHandler);

/* ========================
   BOOTSTRAP
======================== */

async function bootstrap() {
  try {
    logStartupEnvironment();
    logRouteDiagnostics();

    await connectDB();

    // bootstrap admin
    if (isConnected()) {
      const adminCount = await prisma.admin.count();

      if (adminCount === 0) {
        const password = await hashPassword(
          process.env.ADMIN_BOOTSTRAP_PASSWORD || "ChangeMe123!"
        );

        await prisma.admin.create({
          data: {
            username: process.env.ADMIN_BOOTSTRAP_USERNAME || "admin",
            password,
          },
        });

        logger.info("Default admin created");
      }
    }

    // scheduler
    await startScheduler();

    queueProcessor = setInterval(() => {
      processQueue().catch((err) =>
        logger.error({ err }, "Queue error")
      );
    }, 500);

    /* ========================
       META WEBHOOK MODE ONLY
    ======================== */

    logger.info("Meta WhatsApp Webhook mode active");

    /* ========================
       START SERVER
    ======================== */

    server = app.listen(env.PORT || 3000, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
          provider: env.WHATSAPP_PROVIDER,
        },
        "Server started"
      );
    });
  } catch (error) {
    logger.error({ error }, "Bootstrap failed");
    process.exit(1);
  }
}

bootstrap();

/* ========================
   SHUTDOWN
======================== */

async function shutdown() {
  logger.info("Shutting down...");

  stopScheduler();

  if (queueProcessor) {
    clearInterval(queueProcessor);
  }

  server?.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);