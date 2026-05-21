// Small test harness to invoke the webhook controller directly
// Usage: node scripts/testWebhookInvoke.js

(async () => {
  try {
    const { handleWebhook } = require("../src/controllers/webhookController");

    const payload = {
      entry: [
        {
          changes: [
            {
              field: "messages",
              value: {
                messages: [
                  {
                    from: "254700000010",
                    id: "wamid.test.402",
                    timestamp: "1770000002",
                    type: "text",
                    text: { body: "How can I prevent diabetes?" },
                  },
                ],
                contacts: [{ wa_id: "254700000010" }],
                metadata: { phone_number_id: "1139973609202308" },
              },
            },
          ],
          id: "test",
        },
      ],
      object: "whatsapp_business_account",
    };

    const req = {
      method: "POST",
      originalUrl: "/webhook",
      headers: {},
      body: payload,
    };

    const res = {
      sendStatus: (code) => {
        console.log("res.sendStatus ->", code);
      },
      status: (code) => ({
        send: (body) => console.log("res.status.send ->", code, body),
        json: (obj) => console.log("res.status.json ->", code, obj),
      }),
    };

    console.log("Invoking handleWebhook...");
    await handleWebhook(req, res);
    console.log("handleWebhook() call completed (controller may process in background).");
  } catch (err) {
    console.error("Test harness error:", err && err.stack);
    process.exit(1);
  }
})();
