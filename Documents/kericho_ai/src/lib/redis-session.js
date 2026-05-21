/**
 * Redis-backed session store
 * - Persists sessions in Redis with TTL support
 * - Automatically expires sessions after SESSION_TTL seconds
 */

const redis = require('redis');
const env = require('../config/env');
const logger = require('./logger');

let client = null;

async function initRedis() {
  if (client) return client;

  try {
    client = redis.createClient({
      url: env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    client.on('error', (err) => logger.error({ err }, 'Redis client error'));
    client.on('connect', () => logger.info('Redis client connected'));

    await client.connect();
    return client;
  } catch (err) {
    logger.error({ err }, 'Failed to initialize Redis client');
    throw err;
  }
}

async function getSession(phoneNumber) {
  try {
    if (!client) client = await initRedis();

    const key = `session:${String(phoneNumber || '')}`;
    const data = await client.get(key);
    return data ? JSON.parse(data) : createEmptySession();
  } catch (err) {
    logger.warn({ err, phone: phoneNumber }, 'Redis get failed; returning empty session');
    return createEmptySession();
  }
}

async function updateSession(phoneNumber, data = {}) {
  try {
    if (!client) client = await initRedis();

    const key = `session:${String(phoneNumber || '')}`;
    const existing = await getSession(phoneNumber);
    const merged = Object.assign(existing, data, { updatedAt: new Date().toISOString() });

    await client.setEx(key, env.SESSION_TTL, JSON.stringify(merged));
    return merged;
  } catch (err) {
    logger.error({ err, phone: phoneNumber }, 'Redis update failed');
    throw err;
  }
}

async function clearSession(phoneNumber) {
  try {
    if (!client) client = await initRedis();

    const key = `session:${String(phoneNumber || '')}`;
    await client.del(key);
  } catch (err) {
    logger.warn({ err, phone: phoneNumber }, 'Redis clear failed');
  }
}

function createEmptySession() {
  return {
    lastMessage: null,
    topic: null,
    step: null,
    updatedAt: new Date().toISOString(),
  };
}

async function disconnect() {
  if (client) {
    await client.quit();
    client = null;
  }
}

module.exports = {
  getSession,
  updateSession,
  clearSession,
  initRedis,
  disconnect,
};
