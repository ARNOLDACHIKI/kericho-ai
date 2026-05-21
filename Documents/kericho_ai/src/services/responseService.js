const logger = require("../lib/logger");
const env = require("../config/env");

const { generateAiResponse } = require("./aiService");
const {
  detectLanguage,
  getSystemPrompt,
  formatHistoryForLLM,
  getMedicalDisclaimer,
} = require("./languageService");
const { detectEmergency } = require("./safetyService");
const { isGreeting } = require("../utils/greetingDetection");
const { detectSymptom, getSymptomName } = require("../utils/symptomDetection");
const prisma = require("../lib/prisma");
const { normalizePhoneNumber } = require("../utils/phone");

/**
 * Main entry point for processing user messages
 * AI-FIRST APPROACH: All responses generated via LLM
 *
 * @param {string} from - WhatsApp phone number (sender)
 * @param {string} text - User message text
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Final reply text to send
 */
async function processMessage(from, text, options = {}) {
  console.log("📨 processMessage called", { from, text: text?.substring(0, 50) });

  try {
    const normalizedPhone = normalizePhoneNumber(from);
    const language = options.language || detectLanguage(text);

    console.log(`🌐 Language detected: ${language}`);

    let historyFormatted = "";

    if (normalizedPhone) {
      console.log("📜 Retrieving conversation history");
      const history = await getConversationHistory(normalizedPhone, 10);
      historyFormatted = formatHistoryForLLM(history);
    }

    console.log("🧠 Building assistant reply");
    const assistant = await buildAssistantReply(text, {
      language,
      history: historyFormatted,
    });

    if (normalizedPhone && assistant.reply) {
      await storeMessage(normalizedPhone, text, language);
      await storeMessage(normalizedPhone, assistant.reply, language, true);
    }

    return assistant.reply || getErrorFallback(language);
  } catch (error) {
    logger.error({ error: error.message, from, text }, "processMessage error");

    const fallback = getErrorFallback(detectLanguage(text));

    return fallback;
  }
}

/**
 * Generate dynamic AI response (NO hardcoded responses)
 * Uses LLM to understand intent and generate contextual reply
 *
 * @param {string} userMessage - User input
 * @param {string} language - Detected language
 * @param {string} history - Formatted conversation history
 * @returns {Promise<string>} - AI generated reply
 */
async function generateDynamicAiResponse(userMessage, language = "en", history = "", customPrompt = "") {
  console.log("🤖 Generating dynamic AI response");

  try {
    const aiResponse = await generateAiResponse({
      userMessage,
      language,
      history: history ? `\nPrevious context:\n${history}` : "",
      customPrompt: customPrompt || undefined,
    });

    if (!aiResponse || !aiResponse.reply) {
      console.log("⚠️ AI response empty, using fallback");
      return getErrorFallback(language);
    }

    console.log("✅ AI response generated");
    return aiResponse.reply;
  } catch (error) {
    logger.error({ error: error.message }, "generateDynamicAiResponse failed");
    return getErrorFallback(language);
  }
}

/**
 * Generate emergency response
 * Used when emergency symptoms detected
 *
 * @param {string} userMessage - User input
 * @param {string} language - Language code
 * @returns {Promise<string>} - Emergency response text
 */
async function generateEmergencyResponse(userMessage, language = "en") {
  console.log("🚨 Generating emergency response");

  try {
    const emergencyPrompt = `You are a healthcare assistant responding to a medical emergency.

CRITICAL RULES:
- Be calm and reassuring
- STRONGLY recommend immediate medical help NOW
- Suggest: Call 999/911/112 immediately or go to nearest hospital
- Be warm but URGENT
- Keep response SHORT and ACTION-FOCUSED
- Include Kericho area medical facilities if you know them

User: ${userMessage}

Emergency guidance:`;

    const response = await generateAiResponse({
      userMessage,
      language,
      customPrompt: emergencyPrompt,
    });

    return response?.reply || getEmergencyFallback(language);
  } catch (error) {
    logger.error({ error: error.message }, "generateEmergencyResponse failed");
    return getEmergencyFallback(language);
  }
}

/**
 * Generate greeting response
 * Used when a greeting is detected (hi, hello, morning, etc.)
 *
 * @param {string} userMessage - User's greeting
 * @param {string} language - Language code
 * @returns {Promise<string>} - Dynamic greeting response
 */
async function generateGreetingResponse(userMessage, language = "en") {
  console.log("👋 Generating greeting response");

  try {
    const greetingPrompt = `You are a warm, friendly healthcare assistant.

GREETING RESPONSE RULES:
- Reply naturally to the greeting with warmth
- The user's greeting: "${userMessage}"
- Respond in ${language === "sw" ? "Swahili" : "English"} (same language as user)
- After greeting back, ask how they're feeling or what health topic they need help with
- Keep response SHORT (2-3 sentences max)
- Be natural and conversational, NOT robotic
- DO NOT include medical disclaimers in the greeting
- Make it personal and warm

Generate a response that:
1. Greets them back naturally and warmly
2. Asks how they're feeling or what health help they need`;

    const response = await generateAiResponse({
      userMessage,
      language,
      customPrompt: greetingPrompt,
    });

    if (response?.reply) {
      return response.reply;
    }

    console.log("⚠️ No AI response for greeting, returning error fallback");
    return getErrorFallback(language);
  } catch (error) {
    logger.error({ error: error.message }, "generateGreetingResponse failed");
    return getErrorFallback(language);
  }
}

async function buildAssistantReply(userMessage, options = {}) {
  const message = String(userMessage || "").trim();
  const language = options.language || detectLanguage(message);
  const history = options.history || "";
  const symptomKey = detectSymptom(message);

  if (isGreeting(message)) {
    return {
      reply: await generateGreetingResponse(message, language),
      topic: "greeting",
      source: "greeting",
      escalationSuggested: false,
    };
  }

  if (detectEmergency(message)) {
    return {
      reply: await generateEmergencyResponse(message, language),
      topic: "emergency",
      source: "safety",
      escalationSuggested: true,
    };
  }

  const symptomName = symptomKey ? (getSymptomName(symptomKey, language) || symptomKey) : null;
  const customPrompt = symptomName
    ? `You are a safe healthcare assistant. The user may be describing ${symptomName}. Ask one short clarifying question or give concise next-step guidance. Do not diagnose, prescribe, or use canned replies. Keep the response short and human.`
    : "";

  const aiReply = await generateDynamicAiResponse(message, language, history, customPrompt);

  return {
    reply: aiReply,
    topic: symptomName || "general",
    source: symptomName ? "triage" : "ai",
    escalationSuggested: false,
  };
}

/**
 * Store message in database
 * @param {string} phoneNumber - Normalized WhatsApp number
 * @param {string} content - Message content
 * @param {string} language - Language code
 * @param {boolean} isAssistant - Whether this is assistant message
 */
async function storeMessage(phoneNumber, content, language = "en", isAssistant = false) {
  try {
    if (!prisma || !prisma.user) return;

    const user = await prisma.user.upsert({
      where: { whatsappNumber: phoneNumber },
      update: {
        ...(language ? { preferredLanguage: language } : {}),
      },
      create: {
        whatsappNumber: phoneNumber,
        preferredLanguage: language,
      },
    });

    await prisma.conversationMessage.create({
      data: {
        userId: user.id,
        role: isAssistant ? "assistant" : "user",
        content,
        source: isAssistant ? "system" : "whatsapp",
      },
    });

    console.log(`💾 Message stored for ${phoneNumber}`);
  } catch (error) {
    logger.error({ error: error.message }, "Failed to store message");
  }
}

/**
 * Get conversation history for context
 * @param {string} phoneNumber - Normalized WhatsApp number
 * @param {number} limit - Number of messages to retrieve
 * @returns {Promise<Array>} - Array of { role, content } objects
 */
async function getConversationHistory(phoneNumber, limit = 10) {
  try {
    if (!prisma || !prisma.user) return [];

    const user = await prisma.user.findUnique({
      where: { whatsappNumber: phoneNumber },
    });

    if (!user) return [];

    const messages = await prisma.conversationMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return messages.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  } catch (error) {
    logger.error({ error: error.message }, "Failed to get conversation history");
    return [];
  }
}

/**
 * Get error fallback response
 * @param {string} language - Language code
 * @returns {string} - Fallback message
 */
function getErrorFallback(language = "en") {
  const fallbacks = {
    en: "Sorry, I'm having trouble generating a response right now. Please try again.",
    sw: "Samahani, nina shida ya kutengeneza jibu sasa hivi. Tafadhali jaribu tena.",
    kalenjin: "Sorry, nina shida ya kutengeneza response sasa. Jaribu tena baadaye.",
  };

  return fallbacks[language] || fallbacks.en;
}

/**
 * Get emergency fallback response
 * @param {string} language - Language code
 * @returns {string} - Emergency fallback
 */
function getEmergencyFallback(language = "en") {
  const fallbacks = {
    en: "🚨 This appears to be an emergency. Call 999/911/112 immediately or go to the nearest hospital NOW!",
    sw: "🚨 Hii inaweza kuwa DHARURA. Piga 999/911/112 SASA au nenda hospitali HARAKA!",
    kalenjin: "🚨 Emergency! Piga 999/911/112 NOW au ko hospitali HARAKA!",
  };

  return fallbacks[language] || fallbacks.en;
}

/* ========================================
   EXPORTS - SINGLE ENTRY POINT
======================================== */

module.exports = {
  processMessage,
  generateDynamicAiResponse,
  generateEmergencyResponse,
  generateGreetingResponse,
  buildAssistantReply,
  getConversationHistory,
  storeMessage,
};
