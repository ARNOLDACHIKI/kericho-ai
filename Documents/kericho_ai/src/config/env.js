/**
 * Environment Configuration & Validation
 * 
 * This module validates environment variables at startup and provides
 * sensible defaults for development.
 * 
 * See SETUP_GUIDE.env for detailed setup instructions for each variable.
 */

// Support deployment-friendly aliases without breaking existing variable names.
process.env.WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
process.env.WHATSAPP_VERIFY_TOKEN =
  process.env.WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN;
process.env.VERIFY_TOKEN =
  process.env.VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;
process.env.WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID;

const { z } = require("zod");
const pino = require("pino");

const logger = pino();

/**
 * Define and validate environment schema
 * 
 * Rules:
 * - DATABASE_URL: Required PostgreSQL connection string
 * - WHATSAPP_* tokens: Optional (app works in KB-only mode without them)
 * - OPENAI_API_KEY: Optional (falls back to KB search)
 * - All others: Have sensible development defaults
 */
const EnvSchema = z.object({
  // ========== Server Configuration ==========
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  
  PORT: z
    .coerce
    .number()
    .int()
    .positive()
    .default(3000),
  
  APP_BASE_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),

  // ========== Database (Required) ==========
  DATABASE_URL: z
    .string()
    .refine(
      (url) =>
        url.includes("postgresql://") ||
        url.includes("postgres://") ||
        url.startsWith("file:") ||
        url.startsWith("sqlite:"),
      "DATABASE_URL must be a PostgreSQL or SQLite connection string"
    )
    .default("file:./dev.db"),

  // ========== WhatsApp Cloud API (Optional) ==========
  /**
   * Provider mode:
   * - "baileys": Local development with QR code authentication
   * - "meta": Meta's webhook-based Cloud API (production)
   * - "auto": Detects based on availability of tokens
   */
  WHATSAPP_PROVIDER: z
    .enum(["baileys", "meta", "auto"])
    .default("auto"),

  /**
   * Token for webhook verification with Meta
   * Meta will POST to /webhook with this token for verification
   * Change this to something secure in production
   */
  WHATSAPP_VERIFY_TOKEN: z
    .string()
    .min(8, "Should be at least 8 characters for security")
    .default("kericho-verify-token-change-me"),

  /**
   * Meta's access token for sending messages
   * Get from: https://developers.facebook.com/apps/
   * Format: EAAC... (starts with EAAC)
   */
  WHATSAPP_ACCESS_TOKEN: z
    .string()
    .optional(),

  /**
   * Your WhatsApp Business Phone Number ID
   * Get from Meta dashboard
   * Format: numeric ID
   */
  WHATSAPP_PHONE_NUMBER_ID: z
    .string()
    .optional(),
  GOOGLE_MAPS_API_KEY: z
    .string()
    .optional(),

  /**
   * Meta Graph API version
   * Usually points to latest stable version
   */
  WHATSAPP_API_VERSION: z
    .string()
    .default("v20.0"),

  /**
   * WhatsApp send mode:
   * - live: send to Meta Graph API
   * - mock: simulate successful sends (useful for local integration testing)
   */
  WHATSAPP_SEND_MODE: z
    .enum(["live", "mock"])
    .default("live"),

  // ========== OpenAI (Optional) ==========
  /**
   * OpenAI API key for AI-powered responses
   * Get from: https://platform.openai.com/api-keys
   * Format: sk-...
   * 
   * The app works in knowledge-base-only mode if this is not set
   */
  OPENAI_API_KEY: z
    .string()
    .optional(),

  /**
   * Gemini API key for the healthcare response system
   * Get from: https://aistudio.google.com/app/apikey
   * Format: AI... or a Google AI Studio API key
   */
  GEMINI_API_KEY: z
    .string()
    .optional(),

  /**
   * Gemini model name used for replies
   * Recommended default: gemini-1.5-flash for cost and latency
   */
  GEMINI_MODEL: z
    .string()
    .default("gemini-2.0-flash"),

  /**
   * Which OpenAI model to use
   * Options:
   * - gpt-3.5-turbo: Fast, cheap, good for healthcare Q&A
   * - gpt-4: Smarter but slower and more expensive
   * - gpt-4o: Latest optimized model
   */
  OPENAI_MODEL: z
    .enum(["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini"])
    .default("gpt-3.5-turbo"),

  // ========== Ollama (Local Optional Fallback) ==========
  /**
   * Enable local Ollama fallback for AI generation.
   * Useful when hosted providers are unavailable or rate-limited.
   */
  OLLAMA_ENABLED: z
    .coerce
    .boolean()
    .default(true),

  /**
   * Base URL for local Ollama server.
   * Default points to local host.
   */
  OLLAMA_BASE_URL: z
    .string()
    .url()
    .default("http://127.0.0.1:11434"),

  /**
   * Default Ollama model used for local fallback.
   * Example: llama3.1:8b, qwen2.5:7b
   */
  OLLAMA_MODEL: z
    .string()
    .default("llama3.1:latest"),

  /**
   * Timeout for a single Ollama generation call in milliseconds.
   * Local models can take longer on CPU-only machines.
   */
  OLLAMA_TIMEOUT_MS: z
    .coerce
    .number()
    .int()
    .positive()
    .default(120000),

  // ========== Application Settings ==========
  DEFAULT_LANGUAGE: z
    .enum(["en", "sw"])
    .default("en"),

  EMERGENCY_CONTACT_TEXT: z
    .string()
    .default(
      "🚨 This may be a medical emergency. Call 999 or visit the nearest health facility in Kericho County immediately."
    ),

  LOG_LEVEL: z
    .enum(["silent", "error", "warn", "info", "debug", "trace"])
    .default("info"),

  // ========== Admin Dashboard Security ==========
  /**
   * Admin API key for protecting dashboard endpoints
   * This key must be provided in x-api-key header for /admin/* endpoints
   * Generate a strong random string for production
   * Example: openssl rand -hex 32
   */
  ADMIN_API_KEY: z
    .string()
    .min(16, "ADMIN_API_KEY must be at least 16 characters for security")
    .default("admin-key-change-me-in-production"),

  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters for security")
    .default("jwt-secret-change-me-in-production"),

  // ========== Session Storage (Redis) ==========
  /**
   * Session storage provider: "memory" or "redis"
   * - "memory": In-memory store (good for dev, not recommended for production)
   * - "redis": Use Redis for distributed/persistent sessions
   */
  SESSION_PROVIDER: z
    .enum(["memory", "redis"])
    .default("memory"),

  /**
   * Redis connection URL
   * Format: redis://[user:password@]localhost:6379/[db]
   * Example: redis://localhost:6379/1
   * 
   * Only required if SESSION_PROVIDER=redis
   */
  REDIS_URL: z
    .string()
    .optional(),

  /**
   * Session TTL in seconds (how long before a session expires)
   * Default: 24 hours
   */
  SESSION_TTL: z
    .coerce
    .number()
    .int()
    .positive()
    .default(86400),
});

// ========== Parse and Validate ==========

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  
  logger.error(`⚠️ Environment validation error: ${issues}`);
  logger.info("See SETUP_GUIDE.env for configuration instructions");
  
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

const config = parsed.data;

// ========== Validation & Warnings ==========

// Warn if running production without proper security
if (config.NODE_ENV === "production") {
  if (config.WHATSAPP_VERIFY_TOKEN === "kericho-verify-token-change-me") {
    logger.warn("⚠️ WHATSAPP_VERIFY_TOKEN is using default value in production");
  }
  if (config.ADMIN_API_KEY === "admin-key-change-me-in-production") {
    logger.warn("⚠️ ADMIN_API_KEY is using default value in production - CHANGE IT!");
  }
  if (config.JWT_SECRET === "jwt-secret-change-me-in-production") {
    logger.warn("⚠️ JWT_SECRET is using default value in production - CHANGE IT!");
  }
  if (!config.OPENAI_API_KEY) {
    logger.warn("⚠️ Running production without OPENAI_API_KEY (KB-only mode)");
  }
}

// Warn if WhatsApp tokens partially set
if (!config.WHATSAPP_ACCESS_TOKEN && config.WHATSAPP_PROVIDER === "meta") {
  logger.warn("⚠️ Meta provider selected but WHATSAPP_ACCESS_TOKEN not set");
}

// Warn if Redis provider selected but no URL
if (config.SESSION_PROVIDER === "redis" && !config.REDIS_URL) {
  logger.warn("⚠️ Redis session provider selected but REDIS_URL not set; falling back to memory sessions");
}

// Log configuration summary for debugging
logger.debug({
  env: config.NODE_ENV,
  port: config.PORT,
  provider: config.WHATSAPP_PROVIDER,
  sessionProvider: config.SESSION_PROVIDER,
  hasOpenAIKey: !!config.OPENAI_API_KEY,
  hasGeminiKey: !!config.GEMINI_API_KEY,
  hasJWTSecret: !!config.JWT_SECRET,
  hasMetaTokens: !!(config.WHATSAPP_ACCESS_TOKEN && config.WHATSAPP_PHONE_NUMBER_ID),
  msg: "Environment configuration loaded"
});

module.exports = config;

/**
 * Configuration Quick Reference
 * 
 * DEVELOPMENT (Baileys + Local Postgres):
 *   NODE_ENV=development
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kericho_ai
 *   WHATSAPP_PROVIDER=baileys
 *   OPENAI_API_KEY=sk-...
 * 
 * PRODUCTION (Meta + Managed Postgres):
 *   NODE_ENV=production
 *   DATABASE_URL=postgresql://user:pass@host/db
 *   WHATSAPP_PROVIDER=meta
 *   WHATSAPP_VERIFY_TOKEN=<secure-random-string>
 *   WHATSAPP_ACCESS_TOKEN=EAAC...
 *   WHATSAPP_PHONE_NUMBER_ID=<numeric-id>
 *   OPENAI_API_KEY=sk-...
 */
