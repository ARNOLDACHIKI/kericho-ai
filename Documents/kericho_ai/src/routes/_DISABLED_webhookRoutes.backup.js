/**
 * WhatsApp Webhook Routes
 * 
 * CRITICAL: This router handles Meta WhatsApp Cloud API callbacks.
 * - GET /webhook: Verification requests from Meta (hub.challenge response)
 * - POST /webhook: Incoming message payload from Meta
 * 
 * SAFETY REQUIREMENTS:
 * 1. NO authentication middleware applied (Meta doesn't know JWT)
 * 2. NO rate limiting (handled at global level with explicit skip)
 * 3. NO body parsing limits that could reject Meta payloads
 * 4. Token verification happens INSIDE controllers, not middleware
 */

const express = require("express");
const { verifyWebhook, handleWebhook } = require("../controllers/webhookController");

const router = express.Router();

// CRITICAL: GET for Meta webhook verification challenge
router.get("/", (req, res, next) => {
  // Safety: Ensure this is the verification flow
  if (!req.query["hub.mode"] && !req.query["hub.verify_token"] && !req.query["hub.challenge"]) {
    return res.status(400).json({ error: "Missing hub.* query parameters" });
  }
  verifyWebhook(req, res);
});

// CRITICAL: POST for Meta webhook message delivery
router.post("/", (req, res, next) => {
  // Safety: Ensure this is a message delivery (has entry object)
  if (!req.body || !Array.isArray(req.body?.entry)) {
    console.log("[WEBHOOK POST] WARNING: Request missing 'entry' array, but proceeding");
    // Still pass to handler - it will validate and return 200
  }
  handleWebhook(req, res);
});

module.exports = router;
