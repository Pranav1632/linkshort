const express = require('express');
const router = express.Router();
const { register } = require('../metrics/prometheus');

// GET /metrics - Prometheus Scraper Endpoint
router.get('/', async (req, res) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
