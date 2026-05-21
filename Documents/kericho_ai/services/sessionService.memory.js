/**
 * In-memory session store
 * - Synchronous, fast, good for development
 * - Does NOT persist across restarts
 * - NOT recommended for production (use Redis instead)
 *
 * This is the default fallback when Redis is not available.
 */

const sessions = {};

function normalizeKey(phoneNumber) {
  return String(phoneNumber || "");
}

function createEmptySession() {
  return {
    lastMessage: null,
    topic: null,
    step: null,
    updatedAt: new Date().toISOString(),
  };
}

function getSession(phoneNumber) {
  const key = normalizeKey(phoneNumber);
  if (!sessions[key]) {
    sessions[key] = createEmptySession();
  }
  return sessions[key];
}

function updateSession(phoneNumber, data = {}) {
  const key = normalizeKey(phoneNumber);
  const existing = getSession(key);
  const merged = Object.assign(existing, data, { updatedAt: new Date().toISOString() });
  sessions[key] = merged;
  return merged;
}

function clearSession(phoneNumber) {
  const key = normalizeKey(phoneNumber);
  delete sessions[key];
}

function getAllSessions() {
  return Object.assign({}, sessions);
}

function clearAllSessions() {
  for (const key of Object.keys(sessions)) {
    delete sessions[key];
  }
}

module.exports = {
  // Standard interface
  getSession,
  updateSession,
  clearSession,
  // Testing utilities
  getAllSessions,
  clearAllSessions,
};
