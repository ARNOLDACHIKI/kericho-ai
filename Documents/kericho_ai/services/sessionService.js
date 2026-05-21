/**
 * Session service factory
 * - Delegates to memory or Redis based on SESSION_PROVIDER env variable
 * - Both providers implement the same async interface:
 *   - getSession(phoneNumber)
 *   - updateSession(phoneNumber, data)
 *   - clearSession(phoneNumber)
 *
 * Use:
 *   const session = await sessionService.getSession(phone);
 *   await sessionService.updateSession(phone, {topic: 'malaria'});
 *   await sessionService.clearSession(phone);
 */

const env = require('../src/config/env');
const memoryStore = require('./sessionService.memory');
let redisStore = null;

// Lazy-load Redis only if needed
async function initRedisStore() {
  if (redisStore) return redisStore;
  redisStore = require('../src/lib/redis-session');
  await redisStore.initRedis();
  return redisStore;
}

function getProvider() {
  return env.SESSION_PROVIDER === 'redis' ? 'redis' : 'memory';
}

async function getSession(phoneNumber) {
  if (getProvider() === 'redis') {
    const store = await initRedisStore();
    return store.getSession(phoneNumber);
  }
  return memoryStore.getSession(phoneNumber);
}

async function updateSession(phoneNumber, data = {}) {
  if (getProvider() === 'redis') {
    const store = await initRedisStore();
    return store.updateSession(phoneNumber, data);
  }
  return memoryStore.updateSession(phoneNumber, data);
}

async function clearSession(phoneNumber) {
  if (getProvider() === 'redis') {
    const store = await initRedisStore();
    return store.clearSession(phoneNumber);
  }
  return memoryStore.clearSession(phoneNumber);
}

async function disconnect() {
  if (redisStore && redisStore.disconnect) {
    await redisStore.disconnect();
  }
}

module.exports = {
  getSession,
  updateSession,
  clearSession,
  disconnect,
  getProvider, // for testing/debugging
};
