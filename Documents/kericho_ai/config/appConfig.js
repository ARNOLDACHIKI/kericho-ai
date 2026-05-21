/**
 * Application configuration for the healthcare WhatsApp assistant.
 *
 * This file is intentionally simple so new developers can understand
 * the project's scope before working on the business logic.
 */

module.exports = {
  targetUsers: ["rural residents", "youth", "mothers"],
  healthTopics: [
    "malaria",
    "HIV/AIDS",
    "maternal health",
    "nutrition",
    "mental health",
  ],
  supportedLanguages: ["English", "Kiswahili"],
  systemRules: [
    "No diagnosis allowed",
    "Always encourage visiting a healthcare professional",
    "Keep responses simple and clear",
  ],
};
