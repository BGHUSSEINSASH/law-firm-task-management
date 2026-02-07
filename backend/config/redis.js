const { createClient } = require('redis');

const REDIS_URL = process.env.REDIS_URL;

const createInMemoryStore = () => {
  const store = new Map();
  const expirations = new Map();

  const cleanupKey = (key) => {
    const expiresAt = expirations.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      store.delete(key);
      expirations.delete(key);
      return true;
    }
    return false;
  };

  return {
    async get(key) {
      if (cleanupKey(key)) return null;
      return store.has(key) ? store.get(key) : null;
    },
    async setex(key, ttlSeconds, value) {
      store.set(key, value);
      expirations.set(key, Date.now() + ttlSeconds * 1000);
      return 'OK';
    },
    async incr(key) {
      if (cleanupKey(key)) {
        store.set(key, '1');
        return 1;
      }
      const current = parseInt(store.get(key) || '0', 10) + 1;
      store.set(key, String(current));
      return current;
    },
    async del(key) {
      store.delete(key);
      expirations.delete(key);
      return 1;
    },
    async ttl(key) {
      if (!expirations.has(key)) return -1;
      const ttlMs = expirations.get(key) - Date.now();
      if (ttlMs <= 0) {
        store.delete(key);
        expirations.delete(key);
        return -2;
      }
      return Math.floor(ttlMs / 1000);
    }
  };
};

const redisClient = () => {
  if (!REDIS_URL) {
    return createInMemoryStore();
  }

  const client = createClient({ url: REDIS_URL });
  client.on('error', () => {});
  client.connect().catch(() => {});
  return client;
};

module.exports = redisClient();
