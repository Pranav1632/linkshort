const CircuitBreaker = require('opossum');
const { circuitBreakerState } = require('../metrics/prometheus');

const options = {
  timeout: 3000, // If query exceeds 3s, consider failure
  errorThresholdPercentage: 50, // When 50% requests fail, open breaker
  resetTimeout: 10000, // Wait 10s in open state before trying half-open
};

const activeBreakers = new Map();

/**
 * Create a resilient Circuit Breaker wrapper for database queries
 * @param {Function} asyncFn - Async query function
 * @param {string} serviceName - Metric label
 */
function createCircuitBreaker(asyncFn, serviceName = 'postgres_db') {
  const breaker = new CircuitBreaker(asyncFn, options);

  breaker.on('open', () => {
    console.warn(`[CircuitBreaker] ⚠️ Circuit OPEN for ${serviceName}. Failing fast.`);
    circuitBreakerState.set({ service: serviceName }, 1);
  });

  breaker.on('halfOpen', () => {
    console.log(`[CircuitBreaker] 🔄 Circuit HALF-OPEN for ${serviceName}. Testing recovery.`);
    circuitBreakerState.set({ service: serviceName }, 2);
  });

  breaker.on('close', () => {
    console.log(`[CircuitBreaker] ✅ Circuit CLOSED for ${serviceName}. Service healthy.`);
    circuitBreakerState.set({ service: serviceName }, 0);
  });

  breaker.on('fallback', () => {
    console.warn(`[CircuitBreaker] 🛡️ Fallback triggered for ${serviceName}`);
  });

  activeBreakers.set(serviceName, breaker);
  return breaker;
}

function getBreakerStatus() {
  const status = {};
  for (const [name, breaker] of activeBreakers.entries()) {
    status[name] = {
      closed: breaker.closed,
      opened: breaker.opened,
      halfOpen: breaker.halfOpen,
      stats: breaker.stats,
    };
  }
  return status;
}

module.exports = {
  createCircuitBreaker,
  getBreakerStatus,
};
