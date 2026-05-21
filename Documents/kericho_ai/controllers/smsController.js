const logger = require("../src/lib/logger");
const { receiveSMS, sendSMS, splitMessage } = require("../services/smsService");
const { processIncomingMessage } = require("../src/services/conversationService");
const { normalizePhoneNumber } = require("../src/utils/phone");

// Simple language detection fallback for SMS (uses small keyword list)
function detectLanguageForSms(text) {
  if (!text) return "en";
  const t = String(text).toLowerCase();
  const swIndicators = ["habari", "asante", "tafadhali", "homa", "mimba", "afya", "nini"];
  return swIndicators.some((w) => t.includes(w)) ? "sw" : "en";
}

// Keep messages short for SMS recipients (safe limit set to 300 characters)
const SMS_MAX_LEN = 300;

async function smsWebhook(req, res) {
  try {
    const incoming = receiveSMS(req.body);
    const rawFrom = incoming.from || "";
    const from = normalizePhoneNumber(rawFrom) || rawFrom;
    const text = (incoming.text || "").trim();

    logger.info({ from, text }, "Incoming SMS webhook payload");

    if (!from || !text) {
      logger.warn({ incoming }, "SMS webhook missing from or text");
      return res.status(400).json({ success: false, error: "Missing from or text" });
    }

    // Detect language (simple fallback) and process using existing conversation flow
    const language = detectLanguageForSms(text);

    const { user, assistant } = await processIncomingMessage({
      from,
      text,
      source: "sms",
      preferredLanguage: language,
    });

    // SMS-specific: keep responses short and split into parts if necessary
    const replyText = String(assistant.reply || "");
    const parts = splitMessage(replyText, SMS_MAX_LEN);

    // Send each part over SMS sequentially
    for (const part of parts) {
      try {
        await sendSMS(from, part);
      } catch (err) {
        logger.error({ err: err.message, to: from }, "Failed to send SMS part");
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ err: error.message }, "SMS webhook processing failed");
    return res.status(500).json({ success: false, error: "Failed to process SMS" });
  }
}

module.exports = {
  smsWebhook,
};
