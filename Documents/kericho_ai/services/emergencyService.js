/**
 * Emergency Detection Service
 * 
 * Detects life-threatening keywords in user messages
 * and returns appropriate emergency responses.
 * 
 * ARCHITECTURE:
 * - Loads emergency keywords once at startup (cached in memory)
 * - Normalizes incoming messages to lowercase for matching
 * - Returns emergency response with facility suggestions if location available
 */

const fs = require('fs');
const path = require('path');

// Cache emergency keywords in memory for performance
let emergencyKeywords = [];

/**
 * Initialize emergency keywords from JSON file
 * Called once at module load
 */
function initializeKeywords() {
  try {
    const keywordsPath = path.join(__dirname, '../data/emergencyKeywords.json');
    const rawData = fs.readFileSync(keywordsPath, 'utf8');
    emergencyKeywords = JSON.parse(rawData);
    console.log(`[Emergency] Loaded ${emergencyKeywords.length} emergency keywords`);
  } catch (error) {
    console.error('[Emergency] Failed to load keywords:', error.message);
    emergencyKeywords = []; // Fallback to empty array
  }
}

/**
 * Detect if message contains emergency keywords
 * 
 * @param {string} message - User's text message
 * @returns {boolean} - True if emergency keywords detected
 */
function detectEmergency(message) {
  if (!message || typeof message !== 'string') {
    return false;
  }

  const normalizedMessage = message.toLowerCase().trim();

  // Match against any emergency keyword
  for (const keyword of emergencyKeywords) {
    if (normalizedMessage.includes(keyword.toLowerCase())) {
      console.log(`[Emergency] Detected: "${keyword}" in message`);
      return true;
    }
  }

  return false;
}

/**
 * Get urgent emergency response message
 * 
 * @param {object} options - Options for response customization
 * @param {object} options.facilities - Array of nearby facilities
 * @param {string} options.location - User's location label
 * @returns {string} - Formatted emergency response
 */
function getEmergencyResponse(options = {}) {
  const { facilities = null, location = null } = options;

  let baseMessage = `⚠️ MEDICAL EMERGENCY
  
This appears to be a medical emergency. Please take immediate action:

1. Call emergency services immediately (dial your local emergency number)
2. Go to the nearest hospital now
3. If possible, inform family/trusted person of your location`;

  // Add facility suggestions if available
  if (facilities && facilities.length > 0 && location) {
    baseMessage += `

NEAREST HOSPITALS in ${location}:`;
    facilities.forEach((facility, index) => {
      baseMessage += `
${index + 1}. ${facility.name}`;
      if (facility.services && facility.services.length > 0) {
        baseMessage += ` (${facility.services.join(', ')})`;
      }
    });
  }

  baseMessage += `

DO NOT DELAY - Go immediately or call emergency services now.`;

  return baseMessage;
}

/**
 * Get short urgent message for quick response
 * 
 * @returns {string} - Short emergency alert
 */
function getUrgentAlertMessage() {
  return `⚠️ EMERGENCY DETECTED

This may be a medical emergency. Please seek immediate medical attention:
- Call emergency services now
- Go to the nearest hospital immediately`;
}

/**
 * Log emergency for tracking
 * 
 * @param {object} emergencyData - Emergency event data
 * @param {string} emergencyData.userId - User ID
 * @param {string} emergencyData.message - Original message
 * @param {string} emergencyData.timestamp - When detected
 */
function logEmergency(emergencyData) {
  const {
    userId = 'unknown',
    message = '',
    timestamp = new Date().toISOString(),
  } = emergencyData;

  console.log('[EMERGENCY_LOG]', {
    userId,
    messageText: message.substring(0, 100), // First 100 chars only
    timestamp,
    level: 'HIGH_PRIORITY',
  });

  // In production, this would be sent to a separate logging service
  // or written to a dedicated emergency log file
}

// Initialize keywords on module load
initializeKeywords();

module.exports = {
  detectEmergency,
  getEmergencyResponse,
  getUrgentAlertMessage,
  logEmergency,
  initializeKeywords, // Exposed for testing
};
