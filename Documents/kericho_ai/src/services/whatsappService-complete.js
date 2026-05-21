/**
 * WhatsApp Message Sending Service
 * 
 * Integrates with Meta WhatsApp Cloud API to send messages
 * Handles error handling, retries, and formatting
 * 
 * API Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const axios = require("axios");
const env = require("../config/env");
const logger = require("../lib/logger");

/**
 * Base URL for WhatsApp Cloud API
 * Format: https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages
 */
const getApiUrl = () =>
  `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

/**
 * Normalize phone number
 * Removes formatting characters, keeps only digits
 * 
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} Normalized number (digits only)
 * 
 * @example
 * normalizePhoneNumber("+254 712 345 678") // "254712345678"
 */
function normalizePhoneNumber(phoneNumber = "") {
  return String(phoneNumber)
    .trim()
    .replace(/\D/g, ""); // Remove all non-digits
}

/**
 * Send Text Message via WhatsApp Cloud API
 * 
 * @param {object} options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.message - Message text (max 4096 chars)
 * @returns {Promise<object>} API response with message ID
 * 
 * @throws {Error} If API call fails
 * 
 * @example
 * await sendMessage({
 *   to: "254712345678",
 *   message: "Hello! How can I help?"
 * });
 */
async function sendMessage({ to, message }) {
  // ---- Validation ----
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    const error = new Error(
      "WhatsApp credentials not configured in environment"
    );
    error.statusCode = 500;
    throw error;
  }

  const normalizedTo = normalizePhoneNumber(to);

  if (!normalizedTo || normalizedTo.length < 10) {
    const error = new Error("Invalid phone number");
    error.statusCode = 400;
    throw error;
  }

  if (!message || message.trim().length === 0) {
    const error = new Error("Message cannot be empty");
    error.statusCode = 400;
    throw error;
  }

  if (message.length > 4096) {
    const error = new Error("Message too long (max 4096 characters)");
    error.statusCode = 400;
    throw error;
  }

  try {
    logger.debug(
      { to: normalizedTo, messageLength: message.length },
      "Sending WhatsApp message"
    );

    // ---- API Request ----
    const response = await axios.post(
      getApiUrl(),
      {
        messaging_product: "whatsapp",
        to: normalizedTo,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    logger.info(
      { to: normalizedTo, messageId: response.data?.messages?.[0]?.id },
      "Message sent successfully"
    );

    return response.data;
  } catch (error) {
    // ---- Error Handling ----
    if (error.response) {
      const { status, data } = error.response;

      logger.error(
        {
          status,
          error: data?.error,
          to: normalizedTo,
        },
        "WhatsApp API error"
      );

      const err = new Error(
        `WhatsApp API error: ${data?.error?.message || "Unknown error"}`
      );
      err.statusCode = status;
      throw err;
    } else if (error.code === "ECONNABORTED") {
      throw new Error("WhatsApp API request timeout");
    } else {
      logger.error({ error: error.message }, "Failed to send message");
      throw error;
    }
  }
}

/**
 * Parse Incoming Message from WhatsApp Webhook
 * 
 * Extracts message body from Meta's webhook payload
 * Handles various message types (text, interactive buttons, etc.)
 * 
 * @param {object} payload - Webhook payload from Meta
 * @returns {array} Array of message objects with from, text, timestamp
 * 
 * @example
 * const messages = parseIncomingMessage(req.body);
 * for (const msg of messages) {
 *   console.log(msg.from, msg.text);
 * }
 */
function parseIncomingMessage(payload = {}) {
  const incomingMessages = [];

  // ---- Parse Entry Array ----
  const entries = Array.isArray(payload.entry) ? payload.entry : [];

  for (const entry of entries) {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change?.value || {};
      const messages = Array.isArray(value.messages) ? value.messages : [];

      // ---- Extract Each Message ----
      for (const message of messages) {
        // Skip if message from us (message_status update)
        if (message?.type === "unknown") continue;

        // Extract text based on message type
        let text = "";

        if (message?.text?.body) {
          // Standard text message
          text = message.text.body;
        } else if (message?.interactive?.button_reply?.title) {
          // Button response
          text = message.interactive.button_reply.title;
        } else if (message?.interactive?.list_reply?.title) {
          // List selection
          text = message.interactive.list_reply.title;
        } else if (message?.image?.caption) {
          // Image with caption
          text = message.image.caption || "[Image received]";
        } else if (message?.document?.filename) {
          // Document
          text = `[Document: ${message.document.filename}]`;
        } else {
          // Unknown message type
          logger.debug(
            { messageType: message?.type },
            "Skipping unsupported message type"
          );
          continue;
        }

        // Skip empty messages
        if (!text || text.trim().length === 0) continue;

        // ---- Build Message Object ----
        incomingMessages.push({
          from: normalizePhoneNumber(message.from),
          text: text.trim(),
          messageId: message.id,
          timestamp: message.timestamp,
          type: message.type || "text",
        });
      }
    }
  }

  return incomingMessages;
}

// ============ Exports ============
module.exports = {
  sendMessage,
  parseIncomingMessage,
  normalizePhoneNumber,
};

/**
 * Integration Example:
 * 
 * In webhook controller:
 * 
 * const { parseIncomingMessage, sendMessage } = require("./whatsappService");
 * 
 * // Parse incoming
 * const messages = parseIncomingMessage(req.body);
 * 
 * for (const msg of messages) {
 *   const response = await buildResponse(msg.text);
 *   await sendMessage({
 *     to: msg.from,
 *     message: response
 *   });
 * }
 */
