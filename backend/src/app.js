const express = require('express');
const cors = require('cors');
const os = require('os');
const linkRoutes = require('./routes/linkRoutes');
const healthRoutes = require('./routes/healthRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const metricRoutes = require('./routes/metricRoutes');
const { metricsMiddleware } = require('./metrics/prometheus');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Trust the gateway/load balancer proxy so req.ip resolves X-Forwarded-For correctly
app.set('trust proxy', 1);

// 1. Prometheus Metrics Middleware (tracks latency, RPS, status codes)
app.use(metricsMiddleware);

// 2. CORS for Next.js frontend (localhost:3000)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// 3. Body Parser Middleware
app.use(express.json());

// 4. Instance Identification Middleware (Identifies which container replica handled request)
app.use((req, res, next) => {
  res.setHeader('X-Served-By', process.env.HOSTNAME || os.hostname());
  next();
});

// 5. Metrics Route (for Prometheus scrapers)
app.use('/metrics', metricRoutes);

// 6. Health Monitoring Route
app.use('/health', healthRoutes);

// 7. Link Management API Routes
app.use('/api/v1/links', linkRoutes);

// 8. Short URL Redirection Route (top-level /:shortCode)
app.use('/', redirectRoutes);

// 9. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
