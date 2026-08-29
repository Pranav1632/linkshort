const express = require('express');
const router = express.Router();
const linkService = require('../services/linkService');

// GET /:shortCode - Fast 302 Redirection Route
router.get('/:shortCode', async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Filter out standard non-shortCode paths like favicon.ico, robots.txt
    if (shortCode === 'favicon.ico' || shortCode === 'robots.txt') {
      return res.status(404).end();
    }

    const link = await linkService.getLinkByCode(shortCode);

    if (!link) {
      return res.status(404).send('Short URL not found');
    }

    // Return 302 temporary redirect
    return res.redirect(302, link.original_url);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
