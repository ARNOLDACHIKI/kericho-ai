#!/usr/bin/env node

/**
 * WhatsApp Backend Tester
 * 
 * Utility script for testing the WhatsApp backend during development.
 * 
 * Usage:
 *   node utils/test-webhook.js
 *   node utils/test-webhook.js --health
 *   node utils/test-webhook.js --message "what is malaria?"
 *   node utils/test-webhook.js --verify
 */

const axios = require("axios");
const crypto = require("crypto");

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "kericho-verify-token";
const TEST_PHONE = process.env.TEST_PHONE || "27712345678";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(title, "cyan");
  log(`${"=".repeat(60)}\n`, "cyan");
}

function logSuccess(message) {
  log(`✅ ${message}`, "green");
}

function logError(message) {
  log(`❌ ${message}`, "red");
}

function logInfo(message) {
  log(`ℹ️  ${message}`, "blue");
}

function logWarn(message) {
  log(`⚠️  ${message}`, "yellow");
}

// Test functions

async function testHealth() {
  logSection("Testing Health Check");
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, {
      timeout: 5000,
    });
    logSuccess("Health check passed");
    log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    return true;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testWebhookVerify() {
  logSection("Testing Webhook Verification");
  try {
    const challenge = crypto.randomBytes(16).toString("hex");
    const params = new URLSearchParams({
      "hub.mode": "subscribe",
      "hub.verify_token": VERIFY_TOKEN,
      "hub.challenge": challenge,
    });

    logInfo(`Sending verification request with token: ${VERIFY_TOKEN}`);
    logInfo(`Challenge: ${challenge}`);

    const response = await axios.get(`${BASE_URL}/webhook?${params.toString()}`, {
      timeout: 5000,
    });

    if (response.data === challenge) {
      logSuccess("Webhook verification passed");
      return true;
    } else {
      logError(
        `Webhook verification failed: Expected '${challenge}', got '${response.data}'`
      );
      return false;
    }
  } catch (error) {
    logError(`Webhook verification failed: ${error.message}`);
    if (error.response?.status === 403) {
      logWarn("Got 403 Forbidden - verify WHATSAPP_VERIFY_TOKEN is correct");
    }
    return false;
  }
}

async function testIncomingMessage(messageText) {
  logSection("Testing Incoming Message");
  try {
    const phoneNumberId = "567890";
    const messageId = `wamid.test.${Date.now()}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "123456",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "27123456789",
                  phone_number_id: phoneNumberId,
                  business_account_id: "123456",
                },
                messages: [
                  {
                    from: TEST_PHONE,
                    id: messageId,
                    timestamp: timestamp.toString(),
                    type: "text",
                    text: {
                      body: messageText,
                    },
                  },
                ],
                contacts: [
                  {
                    profile: {
                      name: "Test User",
                    },
                    wa_id: TEST_PHONE,
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    logInfo(`Sending message: "${messageText}"`);
    logInfo(`From phone: ${TEST_PHONE}`);
    logInfo(`Message ID: ${messageId}`);

    const response = await axios.post(`${BASE_URL}/webhook`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    logSuccess("Message accepted by webhook");
    log(`Response: ${JSON.stringify(response.data, null, 2)}`);

    if (response.status === 200) {
      logInfo("Webhook returned 200 OK (message queued for processing)");
      logInfo(
        "Note: Response will be sent asynchronously (not in this webhook response)"
      );
      return true;
    }
  } catch (error) {
    logError(`Message test failed: ${error.message}`);
    if (error.response?.data) {
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function testInvalidToken() {
  logSection("Testing Invalid Token (Should Fail)");
  try {
    const challenge = crypto.randomBytes(16).toString("hex");
    const params = new URLSearchParams({
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong-token",
      "hub.challenge": challenge,
    });

    logInfo("Sending verification request with WRONG token...");

    const response = await axios.get(`${BASE_URL}/webhook?${params.toString()}`, {
      timeout: 5000,
      validateStatus: () => true, // Don't throw on any status
    });

    if (response.status === 403) {
      logSuccess("Correctly rejected invalid token with 403 Forbidden");
      return true;
    } else {
      logWarn(
        `Expected 403 Forbidden, got ${response.status}. Response: ${response.data}`
      );
      return false;
    }
  } catch (error) {
    logError(`Unexpected error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  logSection("Running All Tests");

  const results = [];
  let passed = 0;
  let failed = 0;

  // Test 1: Health
  logInfo('Test 1/5: Health Check...');
  if (await testHealth()) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: Webhook Verify
  logInfo('Test 2/5: Webhook Verification...');
  if (await testWebhookVerify()) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: Invalid Token
  logInfo('Test 3/5: Invalid Token Rejection...');
  if (await testInvalidToken()) {
    passed++;
  } else {
    failed++;
  }

  // Test 4: Incoming Message
  logInfo('Test 4/5: Incoming Message (Knowledge Base)...');
  if (await testIncomingMessage("Tell me about malaria")) {
    passed++;
  } else {
    failed++;
  }

  // Test 5: Incoming Message (AI)
  logInfo('Test 5/5: Incoming Message (AI Fallback)...');
  if (
    await testIncomingMessage("What is the GDP of Kenya in 2024?")
  ) {
    passed++;
  } else {
    failed++;
  }

  // Summary
  logSection("Test Summary");
  log(`Passed: ${passed}/5`, "green");
  log(`Failed: ${failed}/5`, failed > 0 ? "red" : "green");

  if (failed === 0) {
    logSuccess("All tests passed! ✨");
  } else {
    logWarn(`${failed} test(s) failed. Check logs above.`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await runAllTests();
  } else if (args[0] === "--health") {
    await testHealth();
  } else if (args[0] === "--verify") {
    await testWebhookVerify();
  } else if (args[0] === "--invalid") {
    await testInvalidToken();
  } else if (args[0] === "--message") {
    const message = args[1] || "Hello, what is malaria?";
    await testIncomingMessage(message);
  } else {
    log("WhatsApp Backend Tester", "bright");
    log("\nUsage:");
    log("  node utils/test-webhook.js              # Run all tests", "dim");
    log("  node utils/test-webhook.js --health     # Test health check", "dim");
    log(
      "  node utils/test-webhook.js --verify     # Test webhook verification",
      "dim"
    );
    log("  node utils/test-webhook.js --invalid    # Test invalid token", "dim");
    log(
      '  node utils/test-webhook.js --message "your message"       # Test incoming message',
      "dim"
    );
    log("\nEnvironment variables:");
    log(`  TEST_BASE_URL=${process.env.TEST_BASE_URL || "http://localhost:3000"}`, "dim");
    log(
      `  WHATSAPP_VERIFY_TOKEN=${process.env.WHATSAPP_VERIFY_TOKEN || "kericho-verify-token"}`,
      "dim"
    );
    log(`  TEST_PHONE=${process.env.TEST_PHONE || "27712345678"}`, "dim");
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  testHealth,
  testWebhookVerify,
  testIncomingMessage,
  testInvalidToken,
};
