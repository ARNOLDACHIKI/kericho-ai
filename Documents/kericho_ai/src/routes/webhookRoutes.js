const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

// Express mounting rule:
// app.use("/webhook", router) + router.get("/") => GET /webhook.
// If this were router.get("/webhook"), the final path would become /webhook/webhook.
router.get("/", webhookController.verifyWebhook);

// Meta sends the message payload to the same mounted root path.
router.post("/", webhookController.handleWebhook);

module.exports = router;