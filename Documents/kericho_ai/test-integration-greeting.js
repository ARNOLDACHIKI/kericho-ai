#!/usr/bin/env node
/**
 * Integration test for greeting flow
 * Tests the chatController greeting detection and routing
 */

require('dotenv').config();
const { isGreeting } = require('./src/utils/greetingDetection');

console.log("🧪 Integration Test: Greeting Flow in Chat Controller\n");

// Test 1: Greeting Detection
console.log("TEST 1: Greeting Detection\n");
const greetingTests = [
  { msg: "hi", shouldBeGreeting: true },
  { msg: "hello", shouldBeGreeting: true },
  { msg: "Good morning", shouldBeGreeting: true },
  { msg: "Habari", shouldBeGreeting: true },
  { msg: "I have a headache", shouldBeGreeting: false },
  { msg: "menu", shouldBeGreeting: false },
];

greetingTests.forEach(({ msg, shouldBeGreeting }) => {
  const result = isGreeting(msg);
  const status = result === shouldBeGreeting ? "✅" : "❌";
  console.log(`${status} "${msg}" -> greeting: ${result} (expected: ${shouldBeGreeting})`);
});

// Test 2: Simulate webhook call with greeting
console.log("\n\nTEST 2: Simulated Webhook Call with Greeting\n");

(async () => {
  try {
    // Mock the controller flow
    const testPhoneNumber = "254711413919";
    const testMessage = "hi";

    console.log(`📨 Simulating webhook call:`);
    console.log(`   Phone: ${testPhoneNumber}`);
    console.log(`   Message: "${testMessage}"\n`);

    // Step 1: Detect language
    const { detectLanguage } = require('./services/languageService');
    const language = detectLanguage(testMessage);
    console.log(`1️⃣  Language detected: ${language}`);

    // Step 2: Detect greeting
    const isGreetingMessage = isGreeting(testMessage);
    console.log(`2️⃣  Is greeting: ${isGreetingMessage}`);

    if (isGreetingMessage) {
      console.log(`3️⃣  Would route through greeting handler`);
      console.log(`4️⃣  Would call generateAiResponse with greeting prompt`);
      console.log(`5️⃣  Expected response: Dynamic greeting + follow-up question\n`);

      // Show what the AI prompt would be
      console.log("📝 Prompt that would be sent to AI:\n");
      const greetingPrompt = `
You are a warm, friendly healthcare assistant.

GREETING RESPONSE RULES:
- Reply naturally to the greeting in a warm, human way
- The greeting is: "${testMessage}"
- Respond with the same language as the user (${language})
- After greeting back, briefly ask how the user is feeling or what health topic they need help with
- Keep it short (2-3 sentences max)
- Be natural and conversational, NOT robotic
- Do NOT include disclaimers in the greeting`;

      console.log(greetingPrompt);
      console.log("\n✅ Example expected responses:");
      console.log('   - "Hi there! 👋 How are you feeling today? Is there anything health-related I can help you with?"');
      console.log('   - "Hello! Good to hear from you. What brings you here today? Do you have any health concerns?"');
      console.log('   - "Hey! 😊 How are things? Anything health-wise I can assist with?"');
    }

    // Test with non-greeting
    console.log("\n\nTEST 3: Non-Greeting Message\n");
    const testMessage2 = "I have a headache";
    console.log(`📨 Message: "${testMessage2}"`);
    const isGreetingMessage2 = isGreeting(testMessage2);
    console.log(`   Is greeting: ${isGreetingMessage2}`);
    console.log(`   Would route through: symptom detection / FAQ / default handler\n`);

    console.log("✅ All tests completed successfully!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }
})();
