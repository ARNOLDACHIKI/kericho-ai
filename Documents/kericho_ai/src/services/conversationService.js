const prisma = require("../lib/prisma");
const logger = require("../lib/logger");
const { buildAssistantReply } = require("./responseService");
const { normalizePhoneNumber } = require("../utils/phone");

async function upsertUser(whatsappNumber, preferredLanguage) {
  const normalizedNumber = normalizePhoneNumber(whatsappNumber);

  if (!normalizedNumber) {
    throw new Error("A valid WhatsApp number is required");
  }

  if (!prisma.isConnected || !prisma.isConnected()) {
    return {
      id: null,
      whatsappNumber: normalizedNumber,
      preferredLanguage: preferredLanguage || null,
      __transient: true,
    };
  }

  return prisma.user.upsert({
    where: { whatsappNumber: normalizedNumber },
    update: {
      ...(preferredLanguage ? { preferredLanguage } : {}),
    },
    create: {
      whatsappNumber: normalizedNumber,
      ...(preferredLanguage ? { preferredLanguage } : {}),
    },
  });
}

async function recordIncomingMessage({ userId, content, source = "whatsapp" }) {
  if (!userId || !prisma.isConnected || !prisma.isConnected()) {
    return null;
  }

  return prisma.conversationMessage.create({
    data: {
      userId,
      role: "user",
      content,
      source,
    },
  });
}

async function recordAssistantMessage({ userId, assistant }) {
  if (!userId || !prisma.isConnected || !prisma.isConnected()) {
    return null;
  }

  return prisma.conversationMessage.create({
    data: {
      userId,
      role: "assistant",
      content: assistant.reply,
      topic: assistant.topic,
      escalationSuggested: assistant.escalationSuggested,
      source: assistant.source,
    },
  });
}

async function processIncomingMessage({
  from,
  text,
  source = "whatsapp",
  preferredLanguage,
}) {
  const user = await upsertUser(from, preferredLanguage);

  await recordIncomingMessage({
    userId: user.id,
    content: text,
    source,
  });

  const assistant = await buildAssistantReply(text);

  await recordAssistantMessage({
    userId: user.id,
    assistant,
  });

  logger.info(
    { whatsappNumber: user.whatsappNumber, topic: assistant.topic, source: assistant.source },
    "Conversation processed"
  );

  return { user, assistant };
}

async function getConversationHistory(whatsappNumber, limit = 10) {
  const normalizedNumber = normalizePhoneNumber(whatsappNumber);

  if (!normalizedNumber) {
    throw new Error("A valid WhatsApp number is required");
  }

  if (!prisma.isConnected || !prisma.isConnected()) {
    return { user: null, messages: [] };
  }

  const user = await prisma.user.findUnique({
    where: { whatsappNumber: normalizedNumber },
  });

  if (!user) {
    return { user: null, messages: [] };
  }

  const messages = await prisma.conversationMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return { user, messages };
}

module.exports = {
  processIncomingMessage,
  getConversationHistory,
  upsertUser,
  // Expose helpers for webhook/session flows
  recordIncomingMessage,
  recordAssistantMessage,
};