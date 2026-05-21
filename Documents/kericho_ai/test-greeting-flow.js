#!/usr/bin/env node
/**
 * Test greeting detection and dynamic response generation
 * Usage: node test-greeting-flow.js
 */

require('dotenv').config();
const { isGreeting } = require('./src/utils/greetingDetection');

console.log("🧪 Testing Greeting Detection\n");

// Test cases
const testCases = [
  { msg: "hi", expected: true },
  { msg: "hello", expected: true },
  { msg: "Hi!", expected: true },
  { msg: "Hello, how are you?", expected: true },
  { msg: "Good morning", expected: true },
  { msg: "Habari", expected: true },
  { msg: "how are you", expected: false },
  { msg: "I have a headache", expected: false },
  { msg: "what can you do", expected: false },
];

let passedCount = 0;
testCases.forEach(({ msg, expected }) => {
  const result = isGreeting(msg);
  const status = result === expected ? "✅" : "❌";
  console.log(`${status} "${msg}" -> ${result} (expected: ${expected})`);
  if (result === expected) passedCount++;
});

console.log(`\n📊 Results: ${passedCount}/${testCases.length} tests passed\n`);

// Now test AI response generation if Gemini is available
if (process.env.GEMINI_API_KEY) {
  console.log("🤖 Testing AI Greeting Response Generation\n");
  
  (async () => {
    try {
      const { generateAiResponse } = require('./src/services/aiService');
      
      const greetings = ["hi", "hello", "good morning"];
      
      for (const greeting of greetings) {
        console.log(`📨 Testing greeting: "${greeting}"`);
        const response = await generateAiResponse({
          userMessage: greeting,
          language: "en"
        });
        
        if (response && response.reply) {
          console.log(`✅ Response: ${response.reply.substring(0, 100)}...\n`);
        } else {
          console.log(`❌ No response generated\n`);
        }
      }
    } catch (error) {
      console.error("❌ Error testing AI response:", error.message);
    }
  })();
} else {
  console.log("⚠️  GEMINI_API_KEY not set. Skipping AI response tests.");
  console.log("Set GEMINI_API_KEY environment variable to test AI responses.\n");
}
