const logger = require("../lib/logger");
const env = require("../config/env");

/**
 * LANGUAGE DETECTION SERVICE
 * Detects user language from message content
 * Supports: English, Swahili, Kalenjin dialects
 */

// Language-specific indicators
const LANGUAGE_INDICATORS = {
  sw: {
    words: [
      "habari", "tafadhali", "maumivu", "afya", "moyo", "kisukari", 
      "kupumua", "saratani", "shinikizo", "hospitali", "dawa", "mganga",
      "naumwa", "msaada", "karibu", "nini", "wapi", "lini", "kwa nini",
      "nina", "mimi", "wewe", "yeye", "sisi", "kwa", "na", "au", "kama",
      "homa", "kifua", "tumbo", "matumbo", "mguu", "mkono", "kichwa"
    ],
    weight: 1.0
  },
  kalenjin: {
    words: [
      "kikoi", "kipkoi", "kipchoge", "kipkemboi", "kiplagat",
      "kipkoech", "kiplelim", "kipketer", "kikuyon", "kipsigis",
      "nandi", "tugen", "marakwet"
    ],
    weight: 0.8
  },
  en: {
    words: [
      "hello", "hi", "good morning", "good afternoon", "good evening",
      "please", "thank you", "thanks", "help", "menu", "hi",
      "fever", "headache", "pain", "cough", "symptoms", "doctor",
      "hospital", "emergency", "medicine", "health", "feeling",
      "how", "what", "when", "where", "why", "can", "should"
    ],
    weight: 0.5
  }
};

/**
 * Detect language from message content
 * @param {string} message - User message
 * @returns {string} - Language code: 'sw', 'en', 'kalenjin'
 */
function detectLanguage(message = "") {
  if (!message || typeof message !== "string") {
    return env.DEFAULT_LANGUAGE || "en";
  }

  const normalized = message.toLowerCase().trim();

  // Count matches per language
  const scores = {};

  Object.entries(LANGUAGE_INDICATORS).forEach(([lang, { words, weight }]) => {
    const matches = words.filter(w => normalized.includes(w)).length;
    scores[lang] = (matches * weight);
  });

  // Find language with highest score
  const detected = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)[0];

  if (detected && detected[1] > 0) {
    logger.info(
      { message: message.substring(0, 50), detected: detected[0], score: detected[1] },
      "Language detected"
    );
    return detected[0];
  }

  return env.DEFAULT_LANGUAGE || "en";
}

/**
 * Get response language name
 * @param {string} lang - Language code
 * @returns {string} - Language name
 */
function getLanguageName(lang) {
  const names = {
    en: "English",
    sw: "Swahili",
    kalenjin: "Kalenjin"
  };

  return names[lang] || lang;
}

/**
 * Get system message for a language
 * Used as system prompt instruction to LLM
 * @param {string} lang - Language code
 * @returns {string} - System prompt
 */
function getSystemPrompt(lang = "en") {
  const prompts = {
    en: `You are AfyaEducatorBot, a warm, empathetic healthcare assistant on WhatsApp.

RULES:
- Be brief (max 3-5 lines per message)
- Use simple, conversational language
- Include empathy naturally: "I hear you", "That sounds tough", "Let's look into it"
- NEVER repeat disclaimers you just said
- Ask follow-up questions naturally
- If emergency symptoms: suggest immediate medical help
- Be human-like, not robotic
- Remember previous messages in the conversation
- Adapt tone based on user's emotional state`,

    sw: `Wewe ni AfyaEducatorBot, msaidizi wa afya wenye moyo juu ya WhatsApp.

KANUNI:
- Joza haraka (mistari 3-5 kwa ujumbe)
- Tumia lugha rahisi na kawaida
- Weka huruma nzuri: "Naisikia", "Hiyo inaonekana ngumu", "Tuangalie pamoja"
- USIREPEATI matangazo tu ulioyasema
- Uliza maswali ya baadaye kwa kawaida
- Ikiwa dalili za dharura: pendekeza msaada wa haraka
- Kuwa kwa kweli, si kama mashine
- Kumbuka ujumbe uliopita katika mazungumzo
- Badilisha toni kulingana na hali ya mtu`,

    kalenjin: `Emet Afya Education Bot, toiten che konisiek or WhatsApp.

ALWELEN:
- Arich korotik (lines 3-5 per message)
- Itembe kontab ne simple
- Tugel empati: "Ane aisiek", "Ije komondo", "Tugel che aiyik"
- PITIK repetition
- Arich questions ne natural  
- Ikiwa emergency: arich medical help ye bik
- Kuwa human, not machine
- Kumbuk conversations
- Badilishe tone kulingana na feeling`
  };

  return prompts[lang] || prompts.en;
}

/**
 * Format conversation history for LLM context
 * @param {Array} messages - Message objects with role, content
 * @returns {string} - Formatted history
 */
function formatHistoryForLLM(messages = []) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return "";
  }

  return messages
    .slice(-10) // Last 10 messages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join("\n");
}

/**
 * Get appropriate disclaimer for language
 * @param {string} lang - Language code
 * @returns {string} - Disclaimer text
 */
function getMedicalDisclaimer(lang = "en") {
  const disclaimers = {
    en: "I'm an educational assistant, not a doctor. For serious concerns, please see a healthcare provider.",
    sw: "Mimi ni msaidizi wa elimu, si mganga. Kwa matatizo makubwa, karibu muone mkungu wa afya.",
    kalenjin: "Ane education assistant, not doctor. Kwa troubles, karibu see health professional."
  };

  return disclaimers[lang] || disclaimers.en;
}

module.exports = {
  detectLanguage,
  getLanguageName,
  getSystemPrompt,
  formatHistoryForLLM,
  getMedicalDisclaimer,
  LANGUAGE_INDICATORS
};
