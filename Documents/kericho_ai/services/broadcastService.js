/**
 * Broadcast Service
 * Sends daily health tips to subscribed users.
 *
 * Usage:
 *   const { sendDailyTips } = require('./broadcastService');
 *   await sendDailyTips();
 */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { sendTextMessage } = require("../src/services/whatsappService");

const prisma = new PrismaClient();

/**
 * Load health tips from JSON file.
 */
function loadHealthTips() {
  try {
    const tipsPath = path.join(__dirname, "../data/healthTips.json");
    const raw = fs.readFileSync(tipsPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("[broadcastService] Failed to load health tips:", error.message);
    return [];
  }
}

/**
 * Pick a random tip from the tips array.
 */
function getRandomTip(tips) {
  if (!tips || tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Send daily health tips to all subscribed users.
 * Respects user's preferred language.
 *
 * Returns { success: true, sent: number, failed: number, errors: [] }
 */
async function sendDailyTips() {
  console.log("[broadcastService] Starting daily tips broadcast...");

  const tips = loadHealthTips();
  if (!tips || tips.length === 0) {
    console.warn("[broadcastService] No tips available");
    return { success: false, sent: 0, failed: 0, errors: ["No tips available"] };
  }

  try {
    // Fetch all subscribed users
    const subscribedUsers = await prisma.user.findMany({
      where: {
        isSubscribed: true,
      },
      select: {
        id: true,
        whatsappNumber: true,
        preferredLanguage: true,
      },
    });

    console.log(
      `[broadcastService] Found ${subscribedUsers.length} subscribed users`
    );

    if (subscribedUsers.length === 0) {
      return { success: true, sent: 0, failed: 0, errors: [] };
    }

    const randomTip = getRandomTip(tips);
    if (!randomTip) {
      console.warn("[broadcastService] Failed to select random tip");
      return { success: false, sent: 0, failed: 0, errors: ["No valid tip selected"] };
    }

    const sent = [];
    const failed = [];

    // Send to each user
    for (const user of subscribedUsers) {
      try {
        const lang = user.preferredLanguage || "en";
        const messageField = lang === "sw" ? "message_sw" : "message_en";
        const message = randomTip[messageField] || randomTip.message_en;

        // Use WhatsApp service to send
        await sendTextMessage({
          to: user.whatsappNumber,
          body: message,
        });

        sent.push(user.whatsappNumber);
        console.log(
          `[broadcastService] ✓ Sent tip to ${user.whatsappNumber} (${lang})`
        );
      } catch (error) {
        failed.push({ user: user.whatsappNumber, error: error.message });
        console.error(
          `[broadcastService] ✗ Failed to send to ${user.whatsappNumber}:`,
          error.message
        );
      }
    }

    const summary = {
      success: failed.length === 0,
      sent: sent.length,
      failed: failed.length,
      errors: failed,
      tipId: randomTip.id,
      timestamp: new Date().toISOString(),
    };

    console.log("[broadcastService] Broadcast complete:", summary);
    return summary;
  } catch (error) {
    console.error("[broadcastService] Broadcast failed:", error);
    return { success: false, sent: 0, failed: 0, errors: [error.message] };
  }
}

module.exports = {
  sendDailyTips,
  loadHealthTips,
  getRandomTip,
};
