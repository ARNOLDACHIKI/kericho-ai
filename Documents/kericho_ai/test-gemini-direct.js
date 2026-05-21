#!/usr/bin/env node
/**
 * Detailed test for greeting flow with debug logging
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("🔍 Debug: Testing Gemini API directly\n");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY not set");
  process.exit(1);
}

console.log("✅ GEMINI_API_KEY found\n");

(async () => {
  try {
    const client = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = client.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    });

    // Test with greeting prompt
    const greetingPrompt = `
You are a warm, friendly healthcare assistant.

GREETING RESPONSE RULES:
- Reply naturally to the greeting in a warm, human way
- The greeting is: "hi"
- Respond with the same language as the user (en)
- After greeting back, briefly ask how the user is feeling or what health topic they need help with
- Keep it short (2-3 sentences max)
- Be natural and conversational, NOT robotic
- Do NOT include disclaimers in the greeting

Language: en

User message:
hi

Generate a warm, natural response that:
1. Greets them back warmly
2. Asks how they're feeling or what health topic they'd like to discuss
`;

    console.log("📤 Sending greeting prompt to Gemini...\n");
    const result = await model.generateContent(greetingPrompt);
    const text = result?.response?.text?.();

    console.log("📥 Gemini Response:\n");
    console.log(text);
    console.log("\n");

    // Check if response includes disclaimer
    if (text.includes("I am not a doctor") || text.includes("This is health education")) {
      console.log("⚠️  Response includes disclaimer (not ideal for greeting)");
    } else {
      console.log("✅ Response does NOT include unnecessary disclaimer");
    }

    // Test if response asks about health
    if (text.toLowerCase().includes("how are you") || 
        text.toLowerCase().includes("how are you feeling") ||
        text.toLowerCase().includes("what can") ||
        text.toLowerCase().includes("what would")) {
      console.log("✅ Response asks follow-up question");
    } else {
      console.log("⚠️  Response might not ask a follow-up question");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
})();
