/**
 * Webhook Controller
 * 
 * Handles incoming WhatsApp webhook requests from Meta
 * 1. Verification: GET request with token
 * 2. Message handling: POST request with messages
 * 
 * Flow:
 * Verify signature → Parse message → Check KB → Call AI → Send response → Save to DB
 */

const logger = require("../lib/logger");
const env = require("../config/env");
const prisma = require("../lib/prisma");

const { parseIncomingMessage, sendMessage } = require("../services/whatsappService");
const { processIncomingMessage } = require("../services/conversationService");
const { normalizePhoneNumber } = require("../utils/phone");

/**
 * GET /webhook - Webhook Verification
 * 
 * Meta sends a GET request to verify the webhook URL
 * Must respond with the challenge token if verification token matches
 * 
 * Query Parameters:
 * - hub.mode: "subscribe"
 * - hub.verify_token: Must match WHATSAPP_VERIFY_TOKEN
 * - hub.challenge: Random string to echo back
 * 
 * @param {object} req - Express request
 * @param {object} res - Express response
 * 
 * @example
 * GET /webhook?hub.mode=subscribe&hub.verify_token=secret&hub.challenge=abc123
 * Response: abc123
 */
function verifyWebhook(req, res) {
  logger.debug("Webhook verification request received");

  // ---- Extract Query Parameters ----
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  // ---- Validate ----
  if (!mode || !token || !challenge) {
    logger.warn("Missing webhook verification parameters");
    return res.sendStatus(400);
  }

  // ---- Verify Token ----
  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    logger.info("✅ Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  logger.warn({ token, expectedToken: env.WHATSAPP_VERIFY_TOKEN }, "Invalid verification token");
  return res.sendStatus(403);
}

/**
 * POST /webhook - Message Handler
 * 
 * Called by Meta when a user sends a message
 * Processes message and sends response
 * Returns 200 immediately to prevent timeout
 * 
 * Request Body Format:
 * {
 *   "entry": [{
 *     "changes": [{
 *       "value": {
 *         "messages": [{
 *           "from": "254712345678",
 *           "id": "wamid.123...",
 *           "text": { "body": "Hello" },
 *           "timestamp": "1234567890"
 *         }],
 *         "contacts": [{
 *           "profile": { "name": "John" },
 *           "wa_id": "254712345678"
 *         }]
 *       }
 *     }]
 *   }]
 * }
 * 
 * @param {object} req - Express request with JSON body
 * @param {object} res - Express response
 * @param {object} next - Express next middleware
 */
async function handleWebhook(req, res, next) {
  try {
    // ---- Parse Timestamp (for logging) ----
    const timestamp = new Date().toISOString();
    logger.debug({ timestamp }, "Webhook received");

    // ---- Permission Check (optional for production) ----
    // Add bearer token or IP whitelisting validation here if needed

    // ---- Parse Incoming Messages ----
    let incomingMessages = [];
    try {
      incomingMessages = parseIncomingMessage(req.body);
    } catch (error) {
      logger.error({ error }, "Failed to parse incoming messages");
      // Return 200 anyway (acknowledge receipt)
      return res.sendStatus(200);
    }

    logger.info(
      { count: incomingMessages.length },
      `Processing ${incomingMessages.length} message(s)`
    );

    // ---- Process Each Message Asynchronously ----
    // Don't wait for processing - return 200 immediately
    // This prevents Meta from retrying our endpoint
    processMessages(incomingMessages).catch((error) => {
      logger.error({ error }, "Error processing messages");
    });

    // ---- Immediate Response to Meta ----
    // Must respond within 30 seconds
    return res.sendStatus(200);
  } catch (error) {
    logger.error({ error }, "Webhook handler error");
    return res.sendStatus(500);
  }
}

/**
 * Process Messages Asynchronously
 * 
 * For each message:
 * 1. Log the message
 * 2. Query knowledge base / AI
 * 3. Send response
 * 4. Save to database
 * 
 * @param {array} messages - Array of parsed messages
 */
async function processMessages(messages) {
  for (const msg of messages) {
    try {
      logger.info(
        { from: msg.from, messageType: msg.type },
        `Processing message: "${msg.text.substring(0, 50)}..."`
      );

      // ---- Process Conversation ----
      // This handles: user upsert, KB/AI lookup, response generation
      const { assistant } = await processIncomingMessage({
        from: msg.from,
        text: msg.text,
        source: "meta-webhook",
      });

      logger.debug(
        { topic: assistant.topic, source: assistant.source },
        "Response generated"
      );

      // ---- Send Response ----
      try {
        await sendMessage({
          to: msg.from,
          message: assistant.reply,
        });

        logger.info({ to: msg.from }, "Response sent successfully");
      } catch (sendError) {
        logger.error({ to: msg.from, error: sendError.message }, "Failed to send response");

        // Try to send error message
        try {
          await sendMessage({
            to: msg.from,
            message:
              "Sorry, I encountered an error processing your message. Please try again or visit https://kericho-county.go.ke/health for resources.",
          });
        } catch (fallbackError) {
          logger.error({ error: fallbackError }, "Failed to send fallback error message");
        }
      }
    } catch (error) {
      logger.error(
        { from: msg.from, error: error.message },
        "Error processing individual message"
      );

      // Continue processing other messages even if one fails
      continue;
    }
  }
}

/**
 * Status Endpoint (optional)
 * Used for monitoring/debugging
 * 
 * @param {object} req
 * @param {object} res
 */
async function getWebhookStatus(req, res) {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      service: "webhook-handler",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Database unavailable for status check");

    res.status(503).json({
      status: "degraded",
      service: "webhook-handler",
      database: "disconnected",
      error: error.message,
    });
  }
}

// ============ Exports ============
module.exports = {
  verifyWebhook,
  handleWebhook,
  getWebhookStatus,
};

/**
 * Route Setup Example:
 * 
 * In routes/webhookRoutes.js:
 * 
 * const router = express.Router();
 * const { verifyWebhook, handleWebhook } = require("../controllers/webhookController");
 * 
 * router.get("/", verifyWebhook);
 * router.post("/", handleWebhook);
 * 
 * export default router;
 */
