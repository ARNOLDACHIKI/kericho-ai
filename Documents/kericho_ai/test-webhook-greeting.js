#!/usr/bin/env node
/**
 * Test greeting flow through webhook endpoint
 * Usage: node test-webhook-greeting.js
 * 
 * This test sends a simulated webhook request to the chat endpoint
 * and displays the response to verify the greeting flow works correctly.
 */

require('dotenv').config();
const http = require('http');

const TEST_CASES = [
  {
    name: "Greeting: hi",
    message: "hi",
    from: "254711413919",
    expectedSource: "greeting",
  },
  {
    name: "Greeting: hello",
    message: "hello",
    from: "254711413920",
    expectedSource: "greeting",
  },
  {
    name: "Greeting: Good morning",
    message: "Good morning",
    from: "254711413921",
    expectedSource: "greeting",
  },
  {
    name: "Non-greeting: I have a headache",
    message: "I have a headache",
    from: "254711413922",
    expectedSource: null, // Will route to symptom or AI
  },
];

function sendWebhookRequest(testCase) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      from: testCase.from,
      message: testCase.message,
      text: testCase.message,
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    console.log(`\n🧪 TEST: ${testCase.name}`);
    console.log(`   Message: "${testCase.message}"`);
    console.log(`   Phone: ${testCase.from}`);
    console.log(`   Sending request...\n`);

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          console.log(`   ✅ Response received:`);
          console.log(`      Source: ${response.source}`);
          console.log(`      Message: ${response.message.substring(0, 100)}...`);

          if (testCase.expectedSource && response.source === testCase.expectedSource) {
            console.log(`      ✅ Routed correctly to: ${testCase.expectedSource}`);
          } else if (testCase.expectedSource) {
            console.log(`      ⚠️  Expected source: ${testCase.expectedSource}, got: ${response.source}`);
          }

          resolve(response);
        } catch (error) {
          console.log(`   ❌ Error parsing response: ${error.message}`);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Request failed: ${error.message}`);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log(`
🚀 Testing Greeting Flow Through Webhook
========================================

This script sends test messages to the webhook endpoint and verifies
that greeting messages are properly detected and routed to the AI
for dynamic response generation.

Connection: http://localhost:3000
  
Make sure the server is running:
  npm run dev

`);

  try {
    // Check if server is running
    console.log("🔍 Checking if server is running...\n");

    for (const testCase of TEST_CASES) {
      try {
        await sendWebhookRequest(testCase);
      } catch (error) {
        console.log(`\n❌ Cannot connect to server. Is it running?`);
        console.log(`   Start the server with: npm run dev\n`);
        break;
      }

      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`
\n✅ Test Summary
=====================

- Greetings: "hi", "hello", "morning"  → Should route through 'greeting' handler
- Non-greetings → Should route through other handlers

Expected Results:
- Greeting messages generate dynamic responses
- Each response is unique and context-aware
- Response includes natural greeting + follow-up question
- No hardcoded "Message received" replies

To manually test:
  curl -X POST http://localhost:3000/webhook \\
    -H "Content-Type: application/json" \\
    -d '{"from":"254711413919","message":"hi"}'

`);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run tests
runTests();
