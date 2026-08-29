const linkService = require('../services/linkService');

/**
 * Controller handling Link management & Analytics APIs
 */
class LinkController {
  /**
   * POST /api/v1/links
   */
  async createLink(req, res, next) {
    try {
      const { originalUrl, customCode } = req.body;

      if (!originalUrl) {
        return res.status(400).json({
          status: 'error',
          error: 'originalUrl is required',
        });
      }

      // Validate URL format
      try {
        new URL(originalUrl);
      } catch (err) {
        return res.status(400).json({
          status: 'error',
          error: 'Invalid URL format. Include http:// or https://',
        });
      }

      const link = await linkService.createLink(originalUrl, customCode);

      return res.status(201).json({
        status: 'success',
        message: 'Short link created successfully',
        data: link,
      });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({
          status: 'error',
          error: 'Short code already in use. Please choose another code.',
        });
      }
      next(err);
    }
  }

  /**
   * GET /api/v1/links - List all links
   */
  async listLinks(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const links = await linkService.listLinks(limit, offset);

      return res.status(200).json({
        status: 'success',
        data: links,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/links/:shortCode
   */
  async getLink(req, res, next) {
    try {
      const { shortCode } = req.params;
      const { link, source } = await linkService.getLinkByCode(shortCode);

      if (!link) {
        return res.status(404).json({
          status: 'error',
          error: 'Short link not found',
        });
      }

      res.setHeader('X-Cache-Source', source);

      return res.status(200).json({
        status: 'success',
        source,
        data: link,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/links/:shortCode
   */
  async deleteLink(req, res, next) {
    try {
      const { shortCode } = req.params;
      const success = await linkService.deleteLink(shortCode);

      if (!success) {
        return res.status(404).json({
          status: 'error',
          error: 'Short link not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Short link deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/links/:shortCode/analytics
   */
  async getAnalytics(req, res, next) {
    try {
      const { shortCode } = req.params;
      const analytics = await linkService.getLinkAnalytics(shortCode);

      return res.status(200).json({
        status: 'success',
        data: analytics,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LinkController();
