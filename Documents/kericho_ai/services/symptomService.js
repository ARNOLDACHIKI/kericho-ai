/**
 * Symptom Checker Service
 *
 * Provides step-by-step guided symptom checking flows.
 * - Detects symptoms from user messages
 * - Manages multi-step interview process
 * - Stores answers in session
 * - Returns safety-first advice
 *
 * Usage:
 *   const { detectSymptom, startFlow, processStep, getFinalAdvice } = require('./symptomService');
 *
 *   // 1. Detect if user is asking about a symptom
 *   const symptom = detectSymptom(userMessage);
 *   if (symptom) {
 *     // 2. Start the flow
 *     const firstQuestion = startFlow(symptom);
 *     // 3. In subsequent messages, process answers
 *     const nextStep = await processStep(session, userInput);
 *     // 4. When flow ends, get advice
 *     const advice = getFinalAdvice(symptom);
 *   }
 */

const fs = require('fs');
const path = require('path');

// Load symptom flows from JSON
let symptomFlows = {};

function loadSymptomFlows() {
  try {
    const flowsPath = path.join(__dirname, '../data/symptomFlows.json');
    const raw = fs.readFileSync(flowsPath, 'utf8');
    symptomFlows = JSON.parse(raw);
    console.log(`[symptomService] Loaded ${Object.keys(symptomFlows).length} symptom flows`);
  } catch (error) {
    console.error('[symptomService] Failed to load symptom flows:', error.message);
    symptomFlows = {};
  }
}

// Initialize on module load
loadSymptomFlows();

/**
 * Detect if message mentions a symptom.
 * 
 * @param {string} message - User's text message
 * @returns {string|null} - Symptom key if found (e.g., 'headache'), or null
 */
function detectSymptom(message) {
  if (!message || typeof message !== 'string') return null;

  const normalizedMsg = message.toLowerCase().trim();

  // Match message against symptom keywords
  for (const [symptomKey, symptomData] of Object.entries(symptomFlows)) {
    if (!symptomData.keywords) continue;

    for (const keyword of symptomData.keywords) {
      if (normalizedMsg.includes(keyword.toLowerCase())) {
        console.log(`[symptomService] Detected symptom: "${symptomKey}"`);
        return symptomKey;
      }
    }
  }

  return null;
}

/**
 * Get first question of a symptom flow.
 * 
 * @param {string} symptom - Symptom key (e.g., 'headache')
 * @param {string} language - 'en' or 'sw'
 * @returns {object|null} - { question, isLastStep } or null if symptom invalid
 */
function startFlow(symptom, language = 'en') {
  const flow = symptomFlows[symptom];
  if (!flow) {
    console.warn(`[symptomService] Unknown symptom: ${symptom}`);
    return null;
  }

  if (!flow.steps || flow.steps.length === 0) {
    console.warn(`[symptomService] No steps in flow: ${symptom}`);
    return null;
  }

  const firstStep = flow.steps[0];
  const questionField = language === 'sw' ? 'question_sw' : 'question_en';
  const question = firstStep[questionField] || firstStep.question_en;

  return {
    question,
    stepIndex: 0,
    stepKey: firstStep.key,
    isLastStep: flow.steps.length === 1,
  };
}

/**
 * Process user input and move to next step.
 * 
 * Stores user's answer in session and returns next question,
 * or final advice if all steps complete.
 *
 * @param {object} sessionData - Current session (should have: currentSymptom, currentStepIndex, answers)
 * @param {string} userInput - User's answer to current question
 * @param {string} language - 'en' or 'sw'
 * @returns {object} - { question?, advice?, stepIndex, isLastStep, answers }
 */
function processStep(sessionData = {}, userInput = '', language = 'en') {
  const {
    currentSymptom = null,
    currentStepIndex = 0,
    answers = {},
  } = sessionData;

  // Validate
  if (!currentSymptom || !symptomFlows[currentSymptom]) {
    return {
      error: 'Invalid or missing symptom',
      stepIndex: currentStepIndex,
    };
  }

  const flow = symptomFlows[currentSymptom];
  if (!flow.steps || flow.steps.length === 0) {
    return { error: 'No steps in flow', stepIndex: currentStepIndex };
  }

  // Get current step and store answer
  const currentStep = flow.steps[currentStepIndex];
  const updatedAnswers = {
    ...answers,
    [currentStep.key]: userInput,
  };

  const nextStepIndex = currentStepIndex + 1;

  // Check if done
  if (nextStepIndex >= flow.steps.length) {
    // All questions answered - return final advice
    const adviceField = language === 'sw' ? 'advice_sw' : 'advice_en';
    const advice = flow[adviceField] || flow.advice_en;

    return {
      isComplete: true,
      advice,
      stepIndex: nextStepIndex,
      isLastStep: true,
      answers: updatedAnswers,
    };
  }

  // More questions - return next one
  const nextStep = flow.steps[nextStepIndex];
  const questionField = language === 'sw' ? 'question_sw' : 'question_en';
  const nextQuestion = nextStep[questionField] || nextStep.question_en;

  return {
    question: nextQuestion,
    stepIndex: nextStepIndex,
    stepKey: nextStep.key,
    isLastStep: nextStepIndex === flow.steps.length - 1,
    answers: updatedAnswers,
  };
}

/**
 * Get final advice for a symptom (all steps completed).
 * 
 * @param {string} symptom - Symptom key
 * @param {string} language - 'en' or 'sw'
 * @returns {string|null} - Advice message or null
 */
function getFinalAdvice(symptom, language = 'en') {
  const flow = symptomFlows[symptom];
  if (!flow) return null;

  const adviceField = language === 'sw' ? 'advice_sw' : 'advice_en';
  return flow[adviceField] || flow.advice_en;
}

/**
 * Get all available symptoms.
 * Useful for showing menu or help.
 * 
 * @param {string} language - 'en' or 'sw'
 * @returns {array} - List of { key, name }
 */
function getAvailableSymptoms(language = 'en') {
  const nameField = language === 'sw' ? 'name_sw' : 'name_en';
  return Object.entries(symptomFlows).map(([key, data]) => ({
    key,
    name: data[nameField] || data.name_en,
  }));
}

/**
 * Get total steps in a flow (for UI progress).
 * 
 * @param {string} symptom - Symptom key
 * @returns {number} - Number of steps or 0
 */
function getTotalSteps(symptom) {
  const flow = symptomFlows[symptom];
  return flow && flow.steps ? flow.steps.length : 0;
}

module.exports = {
  detectSymptom,
  startFlow,
  processStep,
  getFinalAdvice,
  getAvailableSymptoms,
  getTotalSteps,
};
