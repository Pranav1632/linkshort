const express = require('express');
const router = express.Router();
const linkService = require('../services/linkService');
const { createRateLimiter } = require('../middlewares/rateLimiter');

// Rate limiter for redirection lookups: 120 requests per minute
const redirectLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyPrefix: 'rl:redirect',
});

// GET /:shortCode - Fast 302 Redirection Route with Redis Cache-Aside & Rate Limiting
router.get('/:shortCode', redirectLimiter, async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Filter out standard non-shortCode paths like favicon.ico, robots.txt
    if (shortCode === 'favicon.ico' || shortCode === 'robots.txt') {
      return res.status(404).end();
    }

    const { link, source } = await linkService.getLinkByCode(shortCode);

    if (!link) {
      return res.status(404).send('Short URL not found');
    }

    // Set Cache-Source header for transparency & verification
    res.setHeader('X-Cache-Source', source);

    // Return 302 temporary redirect
    return res.redirect(302, link.original_url);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
