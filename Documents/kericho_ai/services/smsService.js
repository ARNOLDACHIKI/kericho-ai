const axios = require("axios");
const logger = require("../src/lib/logger");
const { addToQueue } = require("./queueService");

// Simple, provider-agnostic SMS helper.
// Configuration via environment variables (examples):
// - SMS_PROVIDER: "generic" | "twilio" | "africastalking" (optional)
// - SMS_API_URL: URL to POST messages to (provider-specific)
// - SMS_API_KEY: Authorization token for SMS provider (optional)
// - SMS_SENDER: Sender name/number (optional)

const DEFAULT_MAX_SMS_LENGTH = 300;

function splitMessage(text, maxLen = DEFAULT_MAX_SMS_LENGTH) {
  if (!text) return [""];
  const parts = [];
  let remaining = String(text);
  while (remaining.length > maxLen) {
    // Try to split on sentence/space boundary for readability
    let chunk = remaining.slice(0, maxLen);
    const lastSpace = chunk.lastIndexOf(" ");
    if (lastSpace > Math.floor(maxLen * 0.6)) {
      chunk = chunk.slice(0, lastSpace);
    }
    parts.push(chunk.trim());
    remaining = remaining.slice(chunk.length).trim();
  }
  if (remaining.length) parts.push(remaining);
  return parts;
}

async function sendSMS(phoneNumber, message, options = {}) {
  const to = String(phoneNumber || "").trim();
  const text = String(message || "");

  if (!to) {
    throw new Error("sendSMS: phoneNumber is required");
  }

  // If SMS provider isn't configured, log and simulate send (useful for local dev)
  const SMS_API_URL = process.env.SMS_API_URL;
  const SMS_PROVIDER = process.env.SMS_PROVIDER;
  const SMS_API_KEY = process.env.SMS_API_KEY;
  const SMS_SENDER = process.env.SMS_SENDER;

  if (!SMS_API_URL || !SMS_PROVIDER) {
    logger.info({ to, message: text }, "SMS not configured - simulated send");
    return { success: true, simulated: true };
  }

  try {
    // Generic POST - provider adapters can be added here.
    const payload = {
      to,
      message: text,
      from: SMS_SENDER || undefined,
    };

    const headers = {};
    if (SMS_API_KEY) {
      headers.Authorization = `Bearer ${SMS_API_KEY}`;
    }

    const resp = await axios.post(SMS_API_URL, payload, { headers, timeout: 10000 });
    logger.info({ to, status: resp.status }, "SMS sent via provider");
    return { success: true, providerResponse: resp.data };
  } catch (error) {
    logger.error({ err: error.message, to }, "Failed to send SMS");

    if (!options.skipQueue) {
      addToQueue({
        type: "sms",
        payload: { phoneNumber: to, message: text },
        handler: () => sendSMS(to, text, { skipQueue: true }),
      });
    }

    return { success: false, error: error.message };
  }
}

function receiveSMS(requestData) {
  // Attempt to normalize incoming SMS payload from common providers
  const body = requestData || {};

  // Twilio-style
  if (body.From && body.Body) {
    logger.info({ from: body.From }, "Incoming SMS received");
    return {
      from: body.From,
      text: body.Body,
      raw: body,
    };
  }

  // Generic common fields
  if (body.from && body.text) {
    logger.info({ from: body.from }, "Incoming SMS received");
    return {
      from: body.from,
      text: body.text,
      raw: body,
    };
  }

  if (body.msisdn && body.message) {
    logger.info({ from: body.msisdn }, "Incoming SMS received");
    return {
      from: body.msisdn,
      text: body.message,
      raw: body,
    };
  }

  // Fallback - try first available string field
  const text = body.text || body.message || body.Body || "";
  const from = body.from || body.msisdn || body.From || "unknown";

  logger.info({ from }, "Incoming SMS received");
  return { from, text, raw: body };
}

module.exports = {
  sendSMS,
  receiveSMS,
  splitMessage,
};
