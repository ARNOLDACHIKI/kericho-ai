require("dotenv").config();
const axios = require("axios");

const port = process.env.PORT || 3000;
const baseUrl = `http://localhost:${port}`;
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "some_secure_token";

async function testVerification() {
  const challenge = "test_challenge_123";
  const url = new URL(`${baseUrl}/webhook`);
  url.searchParams.set("hub.mode", "subscribe");
  url.searchParams.set("hub.verify_token", verifyToken);
  url.searchParams.set("hub.challenge", challenge);

  const response = await axios.get(url.toString(), {
    validateStatus: () => true,
  });

  console.log("[Webhook Test] Verification status:", response.status);
  console.log("[Webhook Test] Verification response:", response.data);
}

async function testMessagePost() {
  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              messages: [
                {
                  from: "254712345678",
                  text: { body: "Hello doctor" },
                  id: "wamid.test-message-123",
                  timestamp: `${Math.floor(Date.now() / 1000)}`,
                  type: "text",
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const response = await axios.post(`${baseUrl}/webhook`, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    validateStatus: () => true,
  });

  console.log("[Webhook Test] POST status:", response.status);
  console.log("[Webhook Test] POST response:", response.data);
}

async function main() {
  try {
    console.log("[Webhook Test] Target:", baseUrl);
    await testVerification();
    await testMessagePost();
    console.log("[Webhook Test] Completed");
  } catch (error) {
    console.error("[Webhook Test] Failed:", error.response?.data || error.message);
    process.exitCode = 1;
  }
}

main();
