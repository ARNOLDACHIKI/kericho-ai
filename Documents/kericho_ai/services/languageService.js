/**
 * Simple language detection and translation service
 * Supports English (en) and Kiswahili (sw).
 *
 * - detectLanguage(text): lightweight rule-based detection for Swahili keywords
 * - translateText(text, targetLang): uses OpenAI when available, falls back to identity
 */

const { OpenAI } = require("openai");
const env = require("../src/config/env");

// Lightweight Swahili keyword set for detection
const SWAHILI_KEYWORDS = [
  "habari",
  "maumivu",
  "homa",
  "msaada",
  "tafadhali",
  "daktari",
  "karibu",
  "sijui",
  "ugonjwa",
];

/**
 * Detects whether the given text is Kiswahili or English.
 * Very conservative: returns 'sw' if any Swahili keyword is present, otherwise 'en'.
 * @param {string} text
 * @returns {'en'|'sw'}
 */
function detectLanguage(text) {
  if (!text || typeof text !== "string") return "en";
  const normalized = text.toLowerCase();
  for (const kw of SWAHILI_KEYWORDS) {
    if (normalized.includes(kw)) return "sw";
  }
  return "en";
}

/**
 * Translate text to target language ('en' or 'sw').
 * Uses OpenAI Chat Completions if OPENAI_API_KEY is configured. Falls back to original text.
 * @param {string} text
 * @param {'en'|'sw'} targetLang
 * @returns {Promise<string>}
 */
async function translateText(text, targetLang = "en") {
  if (!text || typeof text !== "string") return text;

  // If target is english or no-op, just return original
  if (targetLang === "en") return text;

  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    // No AI key configured — fallback to original text
    return text;
  }

  try {
    const client = new OpenAI({ apiKey });

    const targetName = targetLang === "sw" ? "Kiswahili" : "English";
    const prompt = `Translate the following text into ${targetName} while keeping it simple and clear for healthcare use. Preserve meaning and do not add medical advice:\n\n"""${text}"""`;

    const resp = await client.chat.completions.create({
      model: env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful translator for a healthcare assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const translated = resp.choices?.[0]?.message?.content;
    if (translated && typeof translated === "string") return translated.trim();
    return text;
  } catch (error) {
    console.error("[languageService] translation error:", error?.message || error);
    return text;
  }
}

module.exports = {
  detectLanguage,
  translateText,
};
