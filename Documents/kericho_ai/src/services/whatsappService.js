const axios = require("axios");
const logger = require("../lib/logger");
const env = require("../config/env");

/**
 * WhatsApp Service - META MODE ONLY (CLEAN VERSION)
 * Baileys removed to avoid duplicate pipelines and webhook conflicts
 */

let qrReady = false;
let webhookPhoneNumberId = null; // Extracted from incoming webhook

function normalizePhoneNumber(phoneNumber = "") {
  return String(phoneNumber)
    .trim()
    .replace(/@s\.whatsapp\.net$/i, "")
    .replace(/@g\.us$/i, "")
    .replace(/[^\d]/g, "");
}

function getWhatsAppToken() {
  return env.WHATSAPP_ACCESS_TOKEN || env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
}

function getPhoneNumberId(phoneNumberIdFromWebhook = null) {
  // Priority: Use webhook-provided ID (most recent from incoming message)
  // Then fallback to .env or environment
  return (
    phoneNumberIdFromWebhook ||
    webhookPhoneNumberId ||
    env.WHATSAPP_PHONE_NUMBER_ID ||
    env.PHONE_NUMBER_ID ||
    process.env.WHATSAPP_PHONE_NUMBER_ID ||
    process.env.PHONE_NUMBER_ID
  );
}

function setWebhookPhoneNumberId(id) {
  if (id) {
    webhookPhoneNumberId = id;
  }
}

/**
 * Send typing indicator ("typing_on") to show the user we're processing
 */
async function sendTypingIndicator(to, phoneNumberIdOverride = null) {
  try {
    const recipient = typeof to === "object" && to !== null ? to.to || to.recipient : to;
    const accessToken = getWhatsAppToken();
    const phoneNumberId = getPhoneNumberId(phoneNumberIdOverride);
    const normalizedTo = normalizePhoneNumber(recipient);

    if (!accessToken || !phoneNumberId || !normalizedTo) return false;

    const sendMode = env.WHATSAPP_SEND_MODE || "live";
    if (sendMode === "mock") {
      logger.info({ to: normalizedTo }, "📝 Mock typing indicator sent");
      return true;
    }

    const apiVersion = env.WHATSAPP_API_VERSION || "v20.0";
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalizedTo,
        type: "typing",
        typing: { is_typing: true },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info({ to: normalizedTo }, "📝 Typing indicator sent");
    return true;
  } catch (err) {
    // Silently fail — typing indicators are not critical
    logger.info({ err }, "Typing indicator failed (non-critical)");
    return false;
  }
}

/* =========================
   QR (DISABLED)
========================= */
function hasQRReady() {
  return qrReady;
}

/* =========================
   INIT (DISABLED SAFELY)
========================= */
async function initiateBaileysConnection() {
  logger.info("🚀 Meta mode active — Baileys fully disabled");
}

/* =========================
   DISCONNECT (NO-OP)
========================= */
async function disconnectBaileys() {
  logger.info("🧹 No Baileys instance to disconnect (Meta mode only)");
}

/* =========================
   INCOMING LISTENER (DISABLED)
========================= */
function onIncomingMessage(callback) {
  logger.info("⚠️ Using Meta webhook — direct listener disabled");
}

/* =========================
   🔥 SEND REAL META WHATSAPP MESSAGE
========================= */
async function sendMessage(to, message, phoneNumberIdOverride = null) {
  try {
    const recipient = typeof to === "object" && to !== null
      ? to.to || to.recipient || to.phoneNumber
      : to;

    const body = typeof to === "object" && to !== null
      ? to.message || to.body
      : message;

    const accessToken = getWhatsAppToken();
    const phoneNumberId = getPhoneNumberId(phoneNumberIdOverride);
    const sendMode = env.WHATSAPP_SEND_MODE || process.env.WHATSAPP_SEND_MODE || "live";

    if (!accessToken) {
      throw new Error("Missing WHATSAPP_ACCESS_TOKEN");
    }

    if (!phoneNumberId) {
      throw new Error("Missing WHATSAPP_PHONE_NUMBER_ID");
    }

    const normalizedTo = normalizePhoneNumber(recipient);

    if (!normalizedTo || normalizedTo.length < 10) {
      throw new Error("Invalid WhatsApp recipient number");
    }

    if (!body || String(body).trim().length === 0) {
      throw new Error("Message cannot be empty");
    }

    if (sendMode === "mock") {
      logger.info(
        {
          to: normalizedTo,
          message: String(body).slice(0, 120),
          phoneNumberId,
        },
        "📤 Mock WhatsApp send succeeded"
      );

      return {
        messaging_product: "whatsapp",
        contacts: [{ wa_id: normalizedTo }],
        messages: [{ id: `mock-${Date.now()}` }],
      };
    }

    const apiVersion = env.WHATSAPP_API_VERSION || process.env.WHATSAPP_API_VERSION || "v20.0";
    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "text",
        text: {
          body: String(body),
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    logger.info(
      { to: normalizedTo, message: String(body).slice(0, 120) },
      "📤 WhatsApp message sent successfully"
    );

    return response.data;

  } catch (error) {
    console.error(
      "❌ Meta send error:",
      error.response?.data || error.message
    );

    logger.error(
      {
        error: error.response?.data || error.message,
      },
      "❌ Failed to send WhatsApp message"
    );

    throw error;
  }
}

function parseIncomingMessage(payload = {}) {
  const incomingMessages = [];
  let phoneNumberId = null;
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change?.value || {};
      
      // Extract phone_number_id from metadata (sent by Meta)
      if (value?.metadata?.phone_number_id && !phoneNumberId) {
        phoneNumberId = value.metadata.phone_number_id;
        setWebhookPhoneNumberId(phoneNumberId);
      }
      
      const messages = Array.isArray(value.messages) ? value.messages : [];

      for (const message of messages) {
        let text = "";

        if (message?.text?.body) {
          text = message.text.body;
        } else if (message?.interactive?.button_reply?.title) {
          text = message.interactive.button_reply.title;
        } else if (message?.interactive?.list_reply?.title) {
          text = message.interactive.list_reply.title;
        } else if (message?.image?.caption) {
          text = message.image.caption || "[Image received]";
        } else if (message?.document?.filename) {
          text = `[Document: ${message.document.filename}]`;
        } else {
          logger.info(
            { messageType: message?.type },
            "Skipping unsupported message type"
          );
          continue;
        }

        if (!text || text.trim().length === 0) continue;

        incomingMessages.push({
          from: normalizePhoneNumber(message.from),
          text: text.trim(),
          messageId: message.id,
          timestamp: message.timestamp,
          type: message.type || "text",
          phoneNumberId: phoneNumberId, // Include for webhook handler
        });
      }
    }
  }

  return incomingMessages;
}

/* =========================
   🔥 OPTIONAL COMPATIBILITY METHOD
========================= */
async function sendTextMessage({ to, body }) {
  return sendMessage(to, body);
}

/* =========================
   EXPORTS
========================= */
module.exports = {
  normalizePhoneNumber,
  hasQRReady,
  initiateBaileysConnection,
  disconnectBaileys,
  onIncomingMessage,
  sendMessage,
  sendTypingIndicator,
  parseIncomingMessage,
  getPhoneNumberId,
  setWebhookPhoneNumberId,
};