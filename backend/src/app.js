const express = require('express');
const cors = require('cors');
const linkRoutes = require('./routes/linkRoutes');
const healthRoutes = require('./routes/healthRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// CORS for Next.js frontend (localhost:3000)
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

// Body Parser Middleware
app.use(express.json());

// 1. Health Monitoring Route
app.use('/health', healthRoutes);

// 2. Link Management API Routes
app.use('/api/v1/links', linkRoutes);

// 3. Short URL Redirection Route (top-level /:shortCode)
app.use('/', redirectRoutes);

// 4. Centralized Error Handler
app.use(errorHandler);

module.exports = app;
