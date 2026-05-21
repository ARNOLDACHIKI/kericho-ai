const {
  detectEmergency,
} = require("../utils/healthSafety");

// ======================================================
// 🔥 CLEANER HEALTHCARE DISCLAIMER
// ======================================================
function buildSafetyPrefix(language = "en") {
  if (language === "sw") {
    return "ℹ️ Ushauri huu si mbadala wa daktari.";
  }

  return "ℹ️ This is not a substitute for professional medical care.";
}

module.exports = {
  detectEmergency,
  buildSafetyPrefix,
};