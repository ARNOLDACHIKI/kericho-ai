/**
 * Knowledge service for simple FAQ matching and educational content lookup.
 *
 * This keeps the first version easy to read and easy to expand later.
 */

const fs = require("fs");
const path = require("path");

const faqsPath = path.join(__dirname, "..", "data", "faqs.json");
const educationalScriptsPath = path.join(
  __dirname,
  "..",
  "data",
  "educationalScripts.json"
);

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw);
}

function findFAQ(userMessage) {
  const message = String(userMessage || "").toLowerCase();
  const faqs = loadJson(faqsPath);

  for (const faq of faqs) {
    const keywordMatch = faq.keywords.some((keyword) =>
      message.includes(String(keyword).toLowerCase())
    );

    if (keywordMatch) {
      return faq;
    }
  }

  return null;
}

function getEducationalContent(topic) {
  const scripts = loadJson(educationalScriptsPath);
  return scripts[topic] || null;
}

module.exports = {
  findFAQ,
  getEducationalContent,
};
