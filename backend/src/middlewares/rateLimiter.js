const { redisClient } = require('../config/redis');

/**
 * Sliding-Window Rate Limiter Middleware using Redis Sorted Sets
 * 
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000ms = 1 min)
 * @param {number} options.max - Maximum requests allowed per window (default: 60)
 * @param {string} options.keyPrefix - Prefix for Redis keys (default: 'ratelimit')
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.max || 60;
  const keyPrefix = options.keyPrefix || 'ratelimit';
  const windowSeconds = Math.ceil(windowMs / 1000);

  return async function rateLimiterMiddleware(req, res, next) {
    // If Redis is not connected, fail open gracefully to maintain uptime
    if (!redisClient.isOpen) {
      return next();
    }

    try {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const key = `${keyPrefix}:${clientIp}`;
      const now = Date.now();
      const clearBefore = now - windowMs;

      // Atomic Redis Multi Transaction
      // 1. Remove old timestamps outside sliding window
      // 2. Count remaining timestamps within window
      // 3. Add current timestamp
      // 4. Set TTL on key
      const multi = redisClient.multi();
      multi.zRemRangeByScore(key, 0, clearBefore);
      multi.zCard(key);
      multi.zAdd(key, { score: now, value: `${now}:${Math.random()}` });
      multi.expire(key, windowSeconds);

      const results = await multi.exec();

      // results[1] is the output of zCard (count before adding current request)
      const currentCount = (results && results[1]) ? Number(results[1]) : 0;
      const remaining = Math.max(0, maxRequests - currentCount - 1);
      const resetTime = Math.ceil((now + windowMs) / 1000);

      // Standard Rate-Limit Headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', resetTime);

      if (currentCount >= maxRequests) {
        const retryAfterSeconds = Math.ceil(windowMs / 1000);
        res.setHeader('Retry-After', retryAfterSeconds);

        return res.status(429).json({
          status: 'error',
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
          retryAfter: retryAfterSeconds,
        });
      }

      next();
    } catch (err) {
      console.error('[RateLimiter] Error evaluating rate limit:', err);
      // Fail open so service remains available during cache anomalies
      next();
    }
  };
}

module.exports = {
  createRateLimiter,
};
