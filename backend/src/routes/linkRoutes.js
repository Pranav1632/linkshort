const express = require('express');
const router = express.Router();
const linkController = require('../controllers/linkController');
const { createRateLimiter } = require('../middlewares/rateLimiter');

// Rate limiter for link creation: 30 requests per minute
const createLinkLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  keyPrefix: 'rl:create-link',
});

// POST /api/v1/links - Create new short URL (Rate limited)
router.post('/', createLinkLimiter, (req, res, next) => linkController.createLink(req, res, next));

// GET /api/v1/links/:shortCode - Fetch short URL details
router.get('/:shortCode', (req, res, next) => linkController.getLink(req, res, next));

module.exports = router;
