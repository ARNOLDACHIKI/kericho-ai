const { LRUCache } = require("lru-cache");

// =======================================================
// 🔥 PRIMARY MEMORY STORE (LRU CACHE)
// =======================================================
const cache = new LRUCache({
  max: 5000,
  ttl: 1000 * 60 * 60 * 24, // 24 hours
});

// =======================================================
// 🔥 SECONDARY FAST MEMORY MAP
// (added safely without conflicts)
// =======================================================
const memory = new Map();

// =======================================================
// 🔥 STORE CONVERSATION
// =======================================================
function addMessage(userId, role, message) {
  // -----------------------------
  // LRU CACHE STORAGE
  // -----------------------------
  const history = cache.get(userId) || [];

  history.push({
    role,
    message,
    time: Date.now(),
  });

  // limit cache history
  if (history.length > 20) {
    history.shift();
  }

  cache.set(userId, history);

  // -----------------------------
  // MAP STORAGE
  // -----------------------------
  if (!memory.has(userId)) {
    memory.set(userId, []);
  }

  memory.get(userId).push({
    role,
    message,
    time: Date.now(),
  });

  // limit map history
  if (memory.get(userId).length > 20) {
    memory.get(userId).shift();
  }
}

// =======================================================
// 🔥 GET HISTORY
// =======================================================
function getHistory(userId) {
  return cache.get(userId) || memory.get(userId) || [];
}

// =======================================================
// 🔥 CLEAR HISTORY
// =======================================================
function clearHistory(userId) {
  cache.delete(userId);
  memory.delete(userId);
}

// =======================================================
// 🔥 EXPORTS
// =======================================================
module.exports = {
  addMessage,
  getHistory,
  clearHistory,
};