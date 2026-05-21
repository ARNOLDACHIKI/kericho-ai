const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

const env = require("../config/env");
const logger = require("../lib/logger");
const { getCache, setCache, buildCacheKey } = require("../../services/cacheService");
const {
  detectEmergency,
  getEmergencyGuidance,
  getSafeFallbackResponse,
} = require("../utils/healthSafety");
const { isGreeting } = require("../utils/greetingDetection");

const RESPONSE_TTL_MS = 30 * 60 * 1000;
const GEMINI_MAX_WAIT_MS = 6000;
const USE_STREAMING = true; // Enable streaming for lower latency

let geminiClient = null;
let geminiModel = null;
let geminiDisabledUntil = 0;

// -------------------- GEMINI INIT --------------------
function getGeminiClient() {
  if (!env.GEMINI_API_KEY) return null;

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  }

  return geminiClient;
}

function getGeminiModel() {
  if (Date.now() < geminiDisabledUntil) return null;

  const client = getGeminiClient();
  if (!client) return null;

  // Use faster model by default to reduce latency
  const modelName = env.GEMINI_MODEL || "gemini-1.5-flash";
  if (!geminiModel || geminiModel.modelName !== modelName) {
    geminiModel = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 256, // Reduce output token limit for faster responses
      },
    });
  }

  return geminiModel;
}

// -------------------- UTIL --------------------
function sanitize(text) {
  if (!text) return "Sorry, I could not process that.";
  if (typeof text !== "string") return String(text);
  return text.replace(/\[object Object\]/g, "").trim();
}

function detectLanguage(message = "") {
  const normalized = String(message || "").toLowerCase();

  const swIndicators = [
    "habari", "tafadhali", "maumivu", "afya",
    "moyo", "kisukari", "kupumua", "saratani", "shinikizo",
  ];

  return swIndicators.some((w) => normalized.includes(w)) ? "sw" : "en";
}

// -------------------- GEMINI PROMPT --------------------
function buildHealthcarePrompt({ userMessage, language, history = "" }) {
  // Check if this is a greeting message and provide specialized prompt
  if (isGreeting(userMessage)) {
    return `
You are a warm, friendly healthcare assistant.

GREETING RESPONSE RULES:
- Reply naturally to the greeting in a warm, human way
- The greeting is: "${userMessage}"
- Respond with the same language as the user (${language})
- After greeting back, briefly ask how the user is feeling or what health topic they need help with
- Keep it short (2-3 sentences max)
- Be natural and conversational, NOT robotic
- Do NOT include disclaimers in the greeting

Language: ${language}

User message:
${userMessage}

Generate a warm, natural response that:
1. Greets them back warmly
2. Asks how they're feeling or what health topic they'd like to discuss
`;
  }

  return `
You are a safe healthcare assistant.

RULES:
- Be VERY brief (max 3–5 lines)
- Do NOT repeat disclaimers every time
- Only give safety guidance, not diagnosis
- If emergency symptoms appear, ask user to seek medical help
- Be calm, human, and clear
- Avoid long paragraphs

Language: ${language}

Conversation history:
${history}

User message:
${userMessage}
`;
}

// -------------------- GEMINI RESPONSE --------------------
async function callGemini(prompt) {
  const model = getGeminiModel();
  if (!model) {
    logger.warn("Gemini model not available");
    return null;
  }

  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.();
    const sanitized = sanitize(text);
    logger.debug({ sanitized: sanitized?.substring(0, 100) }, "Gemini response received");
    return sanitized;
  } catch (err) {
    logger.error({ err: err.message }, "Gemini failed");
    return null;
  }
}

// -------------------- OPENAI (OPTIONAL FALLBACK) --------------------
async function callOpenAI(messages) {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages,
        temperature: 0.4,
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return sanitize(response.data.choices[0].message.content);
  } catch (error) {
    logger.error({ error: error.message }, "OpenAI failed");
    return null;
  }
}

// -------------------- OLLAMA (LOCAL FALLBACK) --------------------
async function callOllama({ prompt }) {
  if (!env.OLLAMA_ENABLED) return null;

  const baseUrl = env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = env.OLLAMA_MODEL || "llama3.1:latest";

  try {
    const response = await axios.post(
      `${baseUrl.replace(/\/$/, "")}/api/generate`,
      {
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.4,
        },
      },
      {
        timeout: env.OLLAMA_TIMEOUT_MS || 120000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const text = sanitize(response?.data?.response || "");
    if (!text) return null;

    logger.info({ model }, "Ollama response received");
    return text;
  } catch (error) {
    logger.warn(
      {
        error: error.message,
        model,
        baseUrl,
      },
      "Ollama fallback unavailable"
    );
    return null;
  }
}

// =======================================================
// 🔥 MAIN AI FUNCTION (USED BY WEBHOOK)
// =======================================================
async function generateAiResponse(options = {}) {
  const userMessage = sanitize(options.userMessage);
  const language = detectLanguage(userMessage);
  const cacheKey = buildCacheKey("ai-response", language, userMessage);

  const cached = getCache(cacheKey);
  if (cached) return cached;

  // EMERGENCY HANDLING
  if (detectEmergency(userMessage)) {
    const emergency = getEmergencyGuidance(language);

    const response = {
      reply: emergency,
      source: "safety",
      emergency: true,
      language,
    };

    setCache(cacheKey, response, RESPONSE_TTL_MS);
    return response;
  }

  const history = options.history || "";

  // Use custom prompt if provided (for greetings, emergency, etc.)
  // Otherwise build standard healthcare prompt
  let prompt;
  if (options.customPrompt) {
    prompt = options.customPrompt;
  } else {
    prompt = buildHealthcarePrompt({
      userMessage,
      language,
      history,
    });
  }

  let reply = await callGemini(prompt);
  let provider = "gemini";

  // FALLBACK TO OLLAMA (LOCAL) IF GEMINI FAILS
  if (!reply) {
    reply = await callOllama({ prompt });
    if (reply) provider = "ollama";
  }

  // FALLBACK TO OPENAI IF GEMINI/OLLAMA FAIL
  if (!reply) {
    reply = await callOpenAI([
      {
        role: "system",
        content:
          "You are a safe healthcare assistant. Be brief, helpful, and non-diagnostic.",
      },
      {
        role: "user",
        content: userMessage,
      },
    ]);
    if (reply) provider = "openai";
  }

  const finalReply = reply || getSafeFallbackResponse({ language });
  if (!reply) provider = "safety-fallback";

  const response = {
    reply: finalReply,
    source: "ai",
    provider,
    emergency: false,
    language,
  };

  setCache(cacheKey, response, RESPONSE_TTL_MS);
  return response;
}

// =======================================================
// 🔥 WEBHOOK ENTRY (OLD SYSTEM SAFE)
// =======================================================
async function generateResponse(message) {
  try {
    console.log("🧠 AI received:", message);

    const result = await generateAiResponse({
      userMessage: message,
    });

    console.log("🤖 AI reply:", result.reply);

    return result.reply;
  } catch (error) {
    console.error("❌ AI error:", error);
    return "Sorry, I couldn't process that right now.";
  }
}

// =======================================================
// 🔥 CONVERSATION-AWARE RESPONSE (CLEAN VERSION)
// =======================================================
async function generateReply(text, history = []) {
  const historyText = history
    .slice(-6)
    .map((h) => `${h.role}: ${h.message}`)
    .join("\n");

  const prompt = `
You are a healthcare assistant chatbot.

RULES:
- Be VERY brief (max 3–5 lines)
- Avoid repeating disclaimers
- Be conversational and calm
- If emergency → advise immediate medical help
- Ask short follow-up questions when needed

Conversation history:
${historyText}

User:
${text}

Assistant:
`;

  // Use same AI engine (Gemini/Ollama/OpenAI fallback)
  const reply = await callGemini(prompt);

  if (reply) return reply;

  const ollamaReply = await callOllama({ prompt });
  if (ollamaReply) return ollamaReply;

  const openaiReply = await callOpenAI([
    { role: "system", content: "You are a helpful healthcare assistant." },
    { role: "user", content: prompt },
  ]);

  return openaiReply || "Sorry, I couldn't respond properly right now.";
}

// =======================================================
// EXPORTS
// =======================================================
module.exports = {
  generateAiResponse,
  generateResponse,
  generateReply,
};