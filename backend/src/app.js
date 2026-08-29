const express = require('express');
const linkRoutes = require('./routes/linkRoutes');
const healthRoutes = require('./routes/healthRoutes');
const redirectRoutes = require('./routes/redirectRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

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
