const client = require('prom-client');

// Initialize Prometheus Register
const register = new client.Registry();

// Enable collection of default system metrics (CPU, Memory, Event Loop, GC)
client.collectDefaultMetrics({
  register,
  prefix: 'linkshort_',
});

// Custom Metric: Total HTTP Requests Counter
const httpRequestsTotal = new client.Counter({
  name: 'linkshort_http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

// Custom Metric: HTTP Request Latency Histogram (p50, p90, p99 percentiles)
const httpRequestDurationSeconds = new client.Histogram({
  name: 'linkshort_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 3], // sub-ms to 3s
});
register.registerMetric(httpRequestDurationSeconds);

// Custom Metric: Redis Cache Hits Counter
const cacheHitsTotal = new client.Counter({
  name: 'linkshort_cache_hits_total',
  help: 'Total number of cache hits in Redis',
  labelNames: ['cache_key_prefix'],
});
register.registerMetric(cacheHitsTotal);

// Custom Metric: Redis Cache Misses Counter
const cacheMissesTotal = new client.Counter({
  name: 'linkshort_cache_misses_total',
  help: 'Total number of cache misses requiring database fallback',
  labelNames: ['cache_key_prefix'],
});
register.registerMetric(cacheMissesTotal);

// Custom Metric: Database Circuit Breaker Status (0=Closed/Healthy, 1=Open/Tripped, 2=HalfOpen/Testing)
const circuitBreakerState = new client.Gauge({
  name: 'linkshort_circuit_breaker_state',
  help: 'Current state of the database Circuit Breaker (0: Closed, 1: Open, 2: Half-Open)',
  labelNames: ['service'],
});
register.registerMetric(circuitBreakerState);
circuitBreakerState.set({ service: 'postgres_db' }, 0); // Default closed

// Express Middleware for tracking HTTP metrics
function metricsMiddleware(req, res, next) {
  // Ignore /metrics and /health from request timing to prevent polluting stats
  if (req.path === '/metrics' || req.path === '/health') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.baseUrl + (req.route ? req.route.path : req.path);
    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDurationSeconds.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      durationInSeconds
    );
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  cacheHitsTotal,
  cacheMissesTotal,
  circuitBreakerState,
};
