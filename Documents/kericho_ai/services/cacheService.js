const cache = new Map();

function normalizeKey(key) {
  return String(key || "").trim();
}

function cleanupExpiredEntry(key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function getCache(key) {
  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) {
    return null;
  }

  return cleanupExpiredEntry(normalizedKey);
}

function setCache(key, value, ttlMs) {
  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) {
    return false;
  }

  const ttl = Number(ttlMs);
  if (!Number.isFinite(ttl) || ttl <= 0) {
    cache.delete(normalizedKey);
    return false;
  }

  cache.set(normalizedKey, {
    value,
    expiresAt: Date.now() + ttl,
  });

  return true;
}

function deleteCache(key) {
  const normalizedKey = normalizeKey(key);
  if (!normalizedKey) {
    return false;
  }

  return cache.delete(normalizedKey);
}

function buildCacheKey(...parts) {
  return parts
    .flat()
    .map((part) => {
      if (part === null || part === undefined) {
        return "";
      }

      if (typeof part === "object") {
        return JSON.stringify(part);
      }

      return String(part);
    })
    .filter(Boolean)
    .join("::");
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
  buildCacheKey,
};
