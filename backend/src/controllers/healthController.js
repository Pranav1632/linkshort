const { checkDbHealth } = require('../config/db');
const { checkRedisHealth } = require('../config/redis');
const { getBreakerStatus } = require('../services/circuitBreaker');

/**
 * Multi-service health monitoring controller
 */
class HealthController {
  /**
   * GET /health
   */
  async getHealth(req, res) {
    let dbStatus = 'healthy';
    let redisStatus = 'healthy';

    try {
      await checkDbHealth();
    } catch (err) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    try {
      await checkRedisHealth();
    } catch (err) {
      redisStatus = `unhealthy: ${err.message}`;
    }

    const breakers = getBreakerStatus();
    const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';

    const payload = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: dbStatus,
        cache: redisStatus,
        circuitBreakers: breakers,
      },
    };

    return res.status(isHealthy ? 200 : 503).json(payload);
  }
}

module.exports = new HealthController();
