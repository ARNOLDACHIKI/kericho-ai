/**
 * Symptom detection utility
 * Detects health-related symptoms from user messages
 */

const symptomFlows = require('../../data/symptomFlows.json');

/**
 * Detect if message contains symptom keywords
 * @param {string} message - User message
 * @returns {string|null} - Detected symptom key or null
 */
function detectSymptom(message = "") {
  const text = String(message || "").toLowerCase().trim();
  
  if (!text) return null;

  // Check each symptom for matching keywords
  for (const [symptomKey, symptomData] of Object.entries(symptomFlows)) {
    const keywords = symptomData.keywords || [];
    
    // Check if any keyword appears in the message
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        return symptomKey;
      }
    }
  }

  return null;
}

/**
 * Get symptom data for further processing
 * @param {string} symptomKey - The detected symptom key
 * @returns {Object|null} - Symptom data or null if not found
 */
function getSymptomData(symptomKey) {
  return symptomFlows[symptomKey] || null;
}

/**
 * Get the first clarification question for a symptom
 * @param {string} symptomKey - The detected symptom key
 * @param {string} language - Language code (en or sw)
 * @returns {string|null} - The first question or null
 */
function getFirstSymptomQuestion(symptomKey, language = "en") {
  const symptomData = getSymptomData(symptomKey);
  if (!symptomData || !symptomData.steps || symptomData.steps.length === 0) {
    return null;
  }

  const firstStep = symptomData.steps[0];
  const questionKey = language === "sw" ? "question_sw" : "question_en";
  return firstStep[questionKey] || null;
}

/**
 * Get symptom name
 * @param {string} symptomKey - The detected symptom key
 * @param {string} language - Language code (en or sw)
 * @returns {string|null} - Symptom name or null
 */
function getSymptomName(symptomKey, language = "en") {
  const symptomData = getSymptomData(symptomKey);
  if (!symptomData) return null;

  const nameKey = language === "sw" ? "name_sw" : "name_en";
  return symptomData[nameKey] || null;
}

module.exports = {
  detectSymptom,
  getSymptomData,
  getFirstSymptomQuestion,
  getSymptomName,
};
