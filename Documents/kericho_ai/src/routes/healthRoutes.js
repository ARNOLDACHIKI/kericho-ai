const express = require("express");
const prisma = require("../lib/prisma");
const env = require("../config/env");
const { isWhatsAppConnected } = require("../services/whatsappService");
const { getLogSummary, getErrorStats } = require("../../services/logService");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "kericho-whatsapp-assistant" });
});

router.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      ok: true,
      database: "reachable",
      whatsapp:
        env.WHATSAPP_PROVIDER === "meta"
          ? "webhook"
          : isWhatsAppConnected()
            ? "connected"
            : "initializing",
    });
  } catch (error) {
    res.status(503).json({ ok: false, database: "unreachable", error: error.message });
  }
});

router.get("/logs", (_req, res) => {
  const summary = getLogSummary(50);
  const stats = getErrorStats();

  res.status(200).json({
    ok: true,
    logging: {
      active: summary.active,
      filesCount: summary.logCount,
      files: summary.files,
      errorStats: stats,
      recentErrors: summary.recentErrors.slice(-20),
      recentCombined: summary.recentCombined.slice(-20),
    },
  });
});

module.exports = router;
