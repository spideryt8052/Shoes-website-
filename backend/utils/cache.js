/**
 * Ultra-Fast In-Memory Cache with TTL & Dynamic Invalidation
 * Dramatically speeds up catalog browsing, stock queries, and prevents database load.
 */

const cacheStore = new Map();

const get = (key) => {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
};

const set = (key, data, ttlSeconds = 60) => {
  // Prune oldest if store exceeds 300 entries to keep memory minimal
  if (cacheStore.size > 300) {
    const oldestKey = cacheStore.keys().next().value;
    cacheStore.delete(oldestKey);
  }
  cacheStore.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  });
};

const clearTag = (prefix) => {
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
};

const clearAll = () => {
  cacheStore.clear();
};

module.exports = { get, set, clearTag, clearAll };
