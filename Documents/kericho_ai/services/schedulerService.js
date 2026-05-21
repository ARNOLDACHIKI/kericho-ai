/**
 * Scheduler Service
 * Sets up cron jobs for automated tasks.
 *
 * Currently scheduled:
 * - Daily health tips at 9:00 AM
 *
 * Usage:
 *   const { startScheduler, stopScheduler } = require('./schedulerService');
 *   startScheduler();
 *
 *   // On shutdown:
 *   stopScheduler();
 */

let cron;
let dailyTipsJob;

async function initCron() {
  try {
    cron = require("node-cron");
    return true;
  } catch (error) {
    console.error(
      "[schedulerService] node-cron not installed. Run: npm install node-cron"
    );
    return false;
  }
}

/**
 * Start all scheduled jobs.
 * Call this once on app startup.
 */
async function startScheduler() {
  const ok = await initCron();
  if (!ok) {
    console.warn("[schedulerService] Scheduler not started (missing dependency)");
    return;
  }

  console.log("[schedulerService] Starting scheduler...");

  // Schedule daily health tips at 9:00 AM
  // Cron format: minute hour day_of_month month day_of_week
  // "0 9 * * *" = 9:00 AM every day
  dailyTipsJob = cron.schedule(
    "0 9 * * *",
    async () => {
      console.log("[schedulerService] Daily tips job triggered");
      try {
        const { sendDailyTips } = require("./broadcastService");
        const result = await sendDailyTips();
        console.log("[schedulerService] Daily tips result:", result);
      } catch (error) {
        console.error("[schedulerService] Daily tips job error:", error.message);
      }
    },
    { scheduled: false } // start manually below
  );

  // Start the job
  dailyTipsJob.start();
  console.log("[schedulerService] ✓ Daily tips scheduled for 9:00 AM every day");
}

/**
 * Stop all scheduled jobs.
 * Call this on app shutdown or graceful cleanup.
 */
function stopScheduler() {
  if (dailyTipsJob) {
    console.log("[Scheduler] Stopping daily tips job");

    if (typeof dailyTipsJob.stop === "function") {
      dailyTipsJob.stop();
    }

    dailyTipsJob = null;
    console.log("[schedulerService] Stopped scheduler");
  }
}

/**
 * Manually trigger the daily tips job (for testing or immediate send).
 */
async function triggerDailyTips() {
  console.log("[schedulerService] Manual trigger: sending daily tips...");
  try {
    const { sendDailyTips } = require("./broadcastService");
    const result = await sendDailyTips();
    return result;
  } catch (error) {
    console.error("[schedulerService] Manual trigger failed:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  triggerDailyTips,
};
