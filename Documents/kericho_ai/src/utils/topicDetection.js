/**
 * Topic detection and duration parsing utilities
 * - Detects health topics from user messages
 * - Parses duration ("2 days", "since yesterday", etc.)
 * - Supports English and Swahili keywords
 */

/**
 * Keyword mappings for health topics
 * Each topic has English and Swahili keywords
 */
const TOPIC_KEYWORDS = {
  malaria: {
    keywords: [
      'malaria', 'mosquito', 'fever', 'chills', 'bite', 'homa',
      'wadudu', 'joto', 'baridi', 'mimba ya malaria'
    ],
  },
  headache: {
    keywords: [
      'headache', 'head pain', 'migraine', 'temple pain',
      'kichwa', 'maumivu ya kichwa', 'maumivu makali', 'kichwa kinayuma'
    ],
  },
  hiv_aids: {
    keywords: [
      'hiv', 'aids', 'arv', 'pep', 'prep', 'status', 'test',
      'msambao', 'virus', 'antiviral'
    ],
  },
  respiratory: {
    keywords: [
      'cough', 'cold', 'flu', 'breathing', 'pneumonia', 'breathe',
      'kohoma', 'mabamba', 'taharuki', 'kupumua'
    ],
  },
  maternal_health: {
    keywords: [
      'pregnant', 'pregnancy', 'prenatal', 'antenatal', 'baby', 'mother',
      'mimba', 'ujauzito', 'mtoto', 'mama', 'kuzaa'
    ],
  },
  nutrition: {
    keywords: [
      'nutrition', 'diet', 'food', 'eating', 'healthy eating',
      'lishe', 'chakula', 'kula', 'vyakula'
    ],
  },
  mental_health: {
    keywords: [
      'stress', 'depression', 'anxiety', 'mental', 'sad', 'worried',
      'msongo', 'kupiga huzuni', 'wasiwasi', 'akili', 'hofu'
    ],
  },
  waterborne: {
    keywords: [
      'diarrhea', 'diarrhoea', 'cholera', 'typhoid', 'water', 'sanitation',
      'kuhara', 'kichocho', 'tipho', 'maji', 'usafi'
    ],
  },
};

/**
 * Topic detection order (most specific first)
 * This order determines which topic is matched first
 * Check respiratory ("kohoma") before malaria ("homa") to avoid false positives
 */
const DETECTION_ORDER = [
  'respiratory',  // Check 'kohoma' first to avoid matching as 'homa' (malaria)
  'hiv_aids',
  'maternal_health',
  'malaria',
  'headache',
  'nutrition',
  'mental_health',
  'waterborne',
];

/**
 * Detect topic from user message
 * Returns the first matching topic or null
 * 
 * @param {string} text - User message
 * @returns {string|null} Topic name (e.g., 'malaria') or null
 */
function detectTopic(text) {
  const normalized = String(text || '').toLowerCase();

  // Use detection order to avoid false positives
  for (const topic of DETECTION_ORDER) {
    const { keywords } = TOPIC_KEYWORDS[topic];
    if (keywords.some(kw => normalized.includes(kw.toLowerCase()))) {
      return topic;
    }
  }

  return null;
}

/**
 * Parse duration from user message
 * Handles formats like:
 *   - "2 days", "3", "5", "1"
 *   - "2 weeks", "1 week"
 *   - "since yesterday", "since morning"
 *   - Swahili: "siku 2", "wiki 1", "jana"
 *
 * @param {string} text - User message
 * @returns {object|null} { raw: string, days: number } or null if no duration found
 */
function parseDuration(text) {
  const t = String(text || '').toLowerCase().trim();

  if (!t) return null;

  // Match "N days/d" or "N weeks/w" (English)
  // More specific regex that captures full word
  const numMatch = t.match(/(\d+)\s+(days?|d|weeks?|w)\b/i);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const unit = numMatch[2].toLowerCase();

    let days = num;
    if (unit.match(/^w/)) days = num * 7;
    if (unit === 'd') days = num;

    return { raw: `${num} ${unit}`, days };
  }

  // Match Swahili: "siku N", "wiki N"
  const swahiliMatch = t.match(/(siku|wiki)\s+(\d+)/);
  if (swahiliMatch) {
    const num = parseInt(swahiliMatch[2], 10);
    const unit = swahiliMatch[1];
    let days = num;
    if (unit === 'wiki') days = num * 7;
    return { raw: swahiliMatch[0], days };
  }

  // Match standalone number (interpret as days)
  const justNum = t.match(/^(\d+)\s*$/);
  if (justNum) {
    const num = parseInt(justNum[1], 10);
    if (num <= 365) {
      return { raw: `${num} days`, days: num };
    }
  }

  // Time references (today/yesterday)
  if (t.includes('yesterday') || t.includes('jana')) {
    return { raw: '1 day', days: 1 };
  }
  if (t.includes('today') || t.includes('leo')) {
    return { raw: '0 days', days: 0 };
  }

  // "since morning", "since this morning"
  if (t.includes('since') || t.includes('since this') || t.includes('tangu')) {
    return { raw: 'since morning', days: 0 };
  }

  return null;
}

/**
 * Get keywords for a given topic
 * Useful for validating or logging detected topics
 * 
 * @param {string} topic - Topic name
 * @returns {array} Array of keywords
 */
function getKeywordsForTopic(topic) {
  return TOPIC_KEYWORDS[topic]?.keywords || [];
}

/**
 * Get all available topics
 * @returns {array} Array of topic names
 */
function getAvailableTopics() {
  return Object.keys(TOPIC_KEYWORDS);
}

module.exports = {
  detectTopic,
  parseDuration,
  getKeywordsForTopic,
  getAvailableTopics,
  TOPIC_KEYWORDS,
};
