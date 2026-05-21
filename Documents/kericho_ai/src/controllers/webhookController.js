const logger = require("../lib/logger");
const env = require("../config/env");
const { parseIncomingMessage, sendMessage, sendTypingIndicator } = require("../services/whatsappService");
const { processIncomingMessage } = require("../services/conversationService");
const { addToQueue } = require("../../services/queueService");

const processedMessageIds = new Set();
const PROCESSED_MESSAGE_TTL_MS = 5 * 60 * 1000;

function rememberMessageId(messageId) {
  processedMessageIds.add(messageId);
  setTimeout(() => processedMessageIds.delete(messageId), PROCESSED_MESSAGE_TTL_MS).unref?.();
}

// =======================================================
// VERIFY WEBHOOK
// =======================================================
exports.verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const verifyToken = process.env.VERIFY_TOKEN || env.WHATSAPP_VERIFY_TOKEN;

  // Meta sends a GET verification request before it delivers messages.
  // The server must echo hub.challenge exactly when the token matches.
  logger.info(
    {
      requestUrl: req.originalUrl,
      method: req.method,
      mode,
      receivedToken: token,
      expectedToken: verifyToken,
      challenge,
    },
    "Webhook verification request received"
  );

  if (mode === "subscribe" && token === verifyToken && challenge) {
    logger.info(
      { requestUrl: req.originalUrl },
      "Webhook verification succeeded"
    );
    return res.status(200).type("text/plain").send(String(challenge));
  }

  logger.warn(
    {
      requestUrl: req.originalUrl,
      method: req.method,
      mode,
      receivedToken: token,
      expectedToken: verifyToken,
      challenge,
    },
    "Webhook verification failed"
  );
  return res.sendStatus(403);
};

// =======================================================
// 🔥 SINGLE CLEAN WEBHOOK PIPELINE
// =======================================================
exports.handleWebhook = async (req, res) => {
  try {
    logger.info(
      {
        requestUrl: req.originalUrl,
        hasBody: Boolean(req.body),
      },
      "Webhook POST received"
    );

    const messages = parseIncomingMessage(req.body);

    if (!messages.length) {
      logger.info({ requestUrl: req.originalUrl }, "No message found in webhook payload");
      return res.sendStatus(200);
    }

    for (const message of messages) {
      const from = message.from;
      const text = message.text || "";
      const messageId = message.messageId;

      if (!from) {
        logger.warn({ requestUrl: req.originalUrl }, "Webhook message missing sender");
        continue;
      }

      if (messageId && processedMessageIds.has(messageId)) {
        logger.info(
          { requestUrl: req.originalUrl, from, messageId },
          "Duplicate webhook message ignored"
        );
        continue;
      }

      if (messageId) {
        rememberMessageId(messageId);
      }

      // Show typing immediately, then continue processing asynchronously.
      void sendTypingIndicator(from, message.phoneNumberId).catch((err) => {
        logger.info({ err, from }, "Typing indicator pre-send failed");
      });

      logger.info(
        { requestUrl: req.originalUrl, from, textPreview: text.slice(0, 80) },
        "Incoming WhatsApp message (enqueued)"
      );

      // Enqueue processing to respond quickly to Meta's webhook.
      try {
        addToQueue({
          type: "process_incoming",
          payload: { from, text, phoneNumberId: message.phoneNumberId, messageId },
          handler: async (job) => {
            const { from: f, text: t, phoneNumberId: pId } = job.payload || {};
            try {
              const { assistant } = await processIncomingMessage({
                from: f,
                text: t,
                source: "meta-webhook",
              });

              if (assistant?.reply) {
                logger.info({ jobId: job.id, to: f }, "Queued: sending reply");
                await sendMessage({ to: f, message: assistant.reply }, undefined, pId);
              }
            } catch (err) {
              logger.error({ err, jobId: job.id }, "Queued job failed to process incoming message");
              throw err;
            }
          },
        });
      } catch (qErr) {
        logger.error({ err: qErr }, "Failed to enqueue incoming message; falling back to inline processing");
        // fallback to inline processing to avoid message loss
        try {
          const { assistant } = await processIncomingMessage({
            from,
            text,
            source: "meta-webhook",
          });

          if (assistant?.reply) {
            await sendMessage({ to: from, message: assistant.reply }, undefined, message.phoneNumberId);
          }
        } catch (err) {
          logger.error({ err }, "Fallback inline processing failed");
        }
      }

      logger.info({ requestUrl: req.originalUrl, from }, "Webhook message enqueued for processing");
    }

    return res.sendStatus(200);

  } catch (err) {
    logger.error({ err, requestUrl: req.originalUrl }, "Webhook handler error");
    return res.sendStatus(200);
  }
};