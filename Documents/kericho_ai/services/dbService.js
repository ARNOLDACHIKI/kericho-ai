const prisma = require("../src/lib/prisma");
const logger = require("../src/lib/logger");
const { normalizePhoneNumber } = require("../src/utils/phone");

async function ensureUser(phoneNumber, preferredLanguage = "en") {
  const whatsappNumber = normalizePhoneNumber(phoneNumber);

  if (!whatsappNumber) {
    throw new Error("A valid phone number is required");
  }

  const user = await prisma.user.upsert({
    where: { whatsappNumber },
    update: {
      ...(preferredLanguage ? { preferredLanguage } : {}),
    },
    create: {
      whatsappNumber,
      preferredLanguage,
    },
  });

  logger.info(
    {
      whatsappNumber: user.whatsappNumber,
      preferredLanguage: user.preferredLanguage,
      userId: user.id,
    },
    "User ensured in database"
  );

  return user;
}

async function getLatestAssistantMessage(phoneNumber) {
  const whatsappNumber = normalizePhoneNumber(phoneNumber);

  if (!whatsappNumber) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { whatsappNumber },
  });

  if (!user) {
    return null;
  }

  return prisma.conversationMessage.findFirst({
    where: {
      userId: user.id,
      role: "assistant",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function saveFeedback({
  phoneNumber,
  rating,
  comment,
  messageId = null,
  preferredLanguage = "en",
}) {
  const user = await ensureUser(phoneNumber, preferredLanguage);

  let resolvedMessageId = messageId;
  if (!resolvedMessageId) {
    const latestAssistantMessage = await getLatestAssistantMessage(phoneNumber);
    resolvedMessageId = latestAssistantMessage?.id || null;
  }

  const feedback = await prisma.feedback.create({
    data: {
      userId: user.id,
      messageId: resolvedMessageId,
      rating: typeof rating === "number" ? rating : null,
      comment: comment ? String(comment).trim() : null,
    },
    include: {
      user: {
        select: {
          whatsappNumber: true,
        },
      },
      message: {
        select: {
          id: true,
          content: true,
          topic: true,
          source: true,
          createdAt: true,
        },
      },
    },
  });

  logger.info(
    {
      userPhone: feedback.user.whatsappNumber,
      rating: feedback.rating,
      feedbackId: feedback.id,
      messageId: feedback.messageId,
    },
    "Feedback saved"
  );

  if ((feedback.rating || 0) > 0 && feedback.rating < 3) {
    logger.warn(
      {
        userPhone: feedback.user.whatsappNumber,
        rating: feedback.rating,
        feedbackId: feedback.id,
        messageId: feedback.messageId,
      },
      "Low-rated response flagged for review"
    );
  }

  return feedback;
}

module.exports = {
  ensureUser,
  getLatestAssistantMessage,
  saveFeedback,
};
