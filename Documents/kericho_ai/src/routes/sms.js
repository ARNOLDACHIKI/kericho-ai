const express = require("express");
const { smsWebhook } = require("../../controllers/smsController");
const { sensitiveRateLimiter } = require("../../middleware/rateLimiter");

const router = express.Router();

router.use(sensitiveRateLimiter);

// Provider webhook for incoming SMS messages
router.post("/webhook", smsWebhook);

module.exports = router;
