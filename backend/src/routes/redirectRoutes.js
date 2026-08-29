const express = require('express');
const router = express.Router();
const linkService = require('../services/linkService');
const { createRateLimiter } = require('../middlewares/rateLimiter');
const { enqueueClickEvent } = require('../queues/clickQueue');

// Rate limiter for redirection lookups: 120 requests per minute
const redirectLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  keyPrefix: 'rl:redirect',
});

// GET /:shortCode - Fast 302 Redirection with Async BullMQ Click Ingestion
router.get('/:shortCode', redirectLimiter, async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Filter out standard non-shortCode paths
    if (shortCode === 'favicon.ico' || shortCode === 'robots.txt') {
      return res.status(404).end();
    }

    const { link, source } = await linkService.getLinkByCode(shortCode);

    if (!link) {
      return res.status(404).send('Short URL not found');
    }

    // Set Cache-Source header
    res.setHeader('X-Cache-Source', source);

    // 1. Asynchronously enqueue click event to BullMQ without blocking redirect
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;

    enqueueClickEvent({
      linkId: link.id,
      shortCode: link.short_code,
      ip: clientIp,
      userAgent: userAgent,
      referrer: referrer,
      clickedAt: new Date().toISOString(),
    });

    // 2. Return Instant 302 Redirect
    return res.redirect(302, link.original_url);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
