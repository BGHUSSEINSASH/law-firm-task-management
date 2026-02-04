const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.enabled = false;
  }

  /**
   * Initialize Redis connection
   */
  async initialize() {
    try {
      if (!process.env.REDIS_URL) {
        console.log('⚠️  Redis URL not configured. Caching disabled.');
        this.enabled = false;
        return;
      }

      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
        },
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err);
        this.enabled = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.enabled = true;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.enabled = false;
    }
  }

  /**
   * Set cache value
   */
  async set(key, value, expiresIn = 3600) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      if (expiresIn) {
        await this.client.setEx(key, expiresIn, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache value
   */
  async get(key) {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete cache value
   */
  async delete(key) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear pattern
   */
  async deletePattern(pattern) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache pattern delete error for ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key, by = 1) {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      return await this.client.incrBy(key, by);
    } catch (error) {
      console.error(`Cache increment error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      return (await this.client.exists(key)) > 0;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache stats
   */
  async getStats() {
    if (!this.enabled || !this.client) {
      return { enabled: false };
    }

    try {
      const info = await this.client.info('stats');
      return { enabled: true, info };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { enabled: false };
    }
  }

  /**
   * Flush all cache
   */
  async flush() {
    if (!this.enabled || !this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
}

module.exports = new CacheService();
