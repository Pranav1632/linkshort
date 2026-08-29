const { redisClient } = require('../config/redis');

/**
 * High-performance Redis Cache Service
 */
class CacheService {
  /**
   * Get parsed JSON value from cache
   * @param {string} key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    try {
      if (!redisClient.isOpen) return null;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error(`[Cache] Error getting key "${key}":`, err.message);
      return null; // Fallback gracefully on cache errors
    }
  }

  /**
   * Store value as JSON string with TTL in seconds
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - Default: 24 hours (86400s)
   */
  async set(key, value, ttlSeconds = 86400) {
    try {
      if (!redisClient.isOpen) return;
      const serialized = JSON.stringify(value);
      await redisClient.set(key, serialized, { EX: ttlSeconds });
    } catch (err) {
      console.error(`[Cache] Error setting key "${key}":`, err.message);
    }
  }

  /**
   * Delete a key from cache
   * @param {string} key
   */
  async del(key) {
    try {
      if (!redisClient.isOpen) return;
      await redisClient.del(key);
    } catch (err) {
      console.error(`[Cache] Error deleting key "${key}":`, err.message);
    }
  }
}

module.exports = new CacheService();
