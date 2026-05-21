/**
 * AI Service
 * 
 * Integrates with OpenAI API for intelligent healthcare responses
 * Provides fallback when knowledge base doesn't have an answer
 * 
 * Features:
 * - GPT-3.5-turbo model (configurable)
 * - Healthcare-specific system prompt
 * - Safety disclaimers
 * - Error handling and fallback responses
 */

const OpenAI = require("openai");
const env = require("../config/env");
const logger = require("../lib/logger");

// Initialize OpenAI client (null if no API key)
const client = env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: env.OPENAI_API_KEY })
  : null;

/**
 * System Prompt for Healthcare Assistant
 * 
 * This prompt instructs the AI to:
 * - Provide ONLY educational content
 * - Never diagnose or prescribe
 * - Always recommend professional care
 * - Use simple language for Kenya
 * - Be respectful of local context
 */
const SYSTEM_PROMPT = `You are a healthcare educational WhatsApp assistant for residents of Kericho County, Kenya.

IMPORTANT RULES:
1. You are NOT a doctor. You provide ONLY educational information.
2. ALWAYS start with: "I am not a doctor, but I can provide health education."
3. NEVER diagnose diseases or prescribe medications.
4. NEVER suggest exact dosages or specific drug names.
5. ALWAYS encourage visiting a healthcare professional for actual medical advice.
6. Keep responses SHORT (max 240 characters) for WhatsApp readability.
7. Use SIMPLE language suitable for rural Kenya residents.
8. Be respectful of Kenyan culture and local beliefs.
9. For ANY concerning symptom, immediately suggest visiting a health facility.

EXAMPLE GOOD RESPONSE:
"I am not a doctor. To prevent malaria, sleep under treated nets, remove stagnant water, and visit a clinic if you develop fever. Seek professional care if symptoms worsen."

EXAMPLE BAD RESPONSE:
"You have malaria. Take 500mg of quinine twice daily." (NEVER do this - it's diagnosing and prescribing)`;

/**
 * Generate AI Response
 * 
 * Calls OpenAI API with healthcare context
 * Falls back gracefully if API is unavailable
 * 
 * @param {object} options
 * @param {string} options.userMessage - User's question
 * @param {string} options.language - Language code ('en' or 'sw')
 * @returns {Promise<string|null>} AI response or null if unavailable
 * 
 * @example
 * const response = await generateAiResponse({
 *   userMessage: "What is malaria?",
 *   language: "en"
 * });
 */
async function generateAiResponse({ userMessage, language = "en" }) {
  // ---- Validation ----
  if (!client || !env.OPENAI_API_KEY) {
    logger.warn(
      "OpenAI not configured - using knowledge base only"
    );
    return null;
  }

  if (!userMessage || userMessage.trim().length === 0) {
    logger.warn("Empty user message received");
    return null;
  }

  try {
    // ---- Language Hint ----
    // Guide the model to respond in the requested language
    const languageHint =
      language === "sw"
        ? "Respond in Kiswahili. Keep it brief and understandable for rural residents."
        : "Respond in English. Keep it brief, clear, and suitable for all education levels.";

    // ---- Call OpenAI ----
    logger.debug(
      { messageLength: userMessage.length, language },
      "Calling OpenAI API"
    );

    const completion = await client.chat.completions.create({
      model: env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `${languageHint}\n\nUser question: ${userMessage}`,
        },
      ],
      max_tokens: 150, // Limit response length for WhatsApp
      temperature: 0.3, // Lower temperature = more focused responses
      top_p: 0.9,
    });

    // ---- Extract Response ----
    const text = completion.choices?.[0]?.message?.content || "";

    if (!text.trim()) {
      logger.warn("Empty response from OpenAI");
      return null;
    }

    logger.debug(
      { model: completion.model, tokens: completion.usage?.total_tokens },
      "OpenAI response generated"
    );

    return text.trim();
  } catch (error) {
    // ---- Error Handling ----
    if (error.status === 401) {
      logger.error("OpenAI authentication failed - check API key");
    } else if (error.status === 429) {
      logger.warn("OpenAI rate limit exceeded - using KB only");
    } else if (error.status === 500) {
      logger.warn("OpenAI service temporarily unavailable");
    } else {
      logger.error({ error: error.message }, "OpenAI API error");
    }

    return null; // Graceful fallback
  }
}

// ============ Exports ============
module.exports = {
  generateAiResponse,
};

/**
 * Usage in Response Service:
 * 
 * const { generateAiResponse } = require("./aiService");
 * 
 * const aiResponse = await generateAiResponse({
 *   userMessage: userInput,
 *   language: detectedLanguage
 * });
 * 
 * if (aiResponse) {
 *   return buildReply(aiResponse, "ai");
 * } else {
 *   return buildFallbackReply();
 * }
 */
