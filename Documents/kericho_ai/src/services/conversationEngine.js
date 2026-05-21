const aiService = require("./aiService");

/**
 * Conversation Intelligence Layer
 * - Makes responses SHORT
 * - Removes repetition
 * - Adds safety + clarity
 * - Prevents hallucinated verbosity
 */

function buildSystemPrompt() {
  return `
You are a medical information assistant for a WhatsApp healthcare app.

RULES:
- Be VERY brief (max 3-5 lines)
- Be calm and non-alarming
- Always include safety advice when symptoms are mentioned
- NEVER repeat disclaimers multiple times
- NEVER output objects or [object Object]
- Ask ONE follow-up question only when necessary
- If emergency symptoms appear → advise urgent medical care immediately
- Do NOT sound robotic
`;
}

function cleanResponse(text) {
  if (!text) return "I’m here to help. Can you explain more?";

  return text
    .replace(/\[object Object\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function generateReply(userMessage, context = []) {
  const prompt = buildSystemPrompt();

  const messages = [
    { role: "system", content: prompt },
    ...context,
    { role: "user", content: userMessage }
  ];

  const raw = await aiService.generateResponse(messages);

  return cleanResponse(raw);
}

module.exports = {
  generateReply
};