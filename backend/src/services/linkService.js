const { query } = require('../config/db');
const { generateShortCode } = require('../utils/codeGenerator');
const cacheService = require('./cacheService');

/**
 * Service for Link operations with Redis Cache-Aside optimization & Analytics
 */
class LinkService {
  /**
   * Create a new shortened link & populate Redis cache
   * @param {string} originalUrl - Destination URL
   * @param {string} [customCode] - Optional custom alias
   * @returns {Promise<Object>} Created link record
   */
  async createLink(originalUrl, customCode) {
    const shortCode = customCode || generateShortCode(3);

    const sql = `
      INSERT INTO links (original_url, short_code)
      VALUES ($1, $2)
      RETURNING id, short_code, original_url, created_at, updated_at;
    `;

    const result = await query(sql, [originalUrl, shortCode]);
    const link = result.rows[0];

    // Prime the Redis cache immediately (TTL: 24h)
    await cacheService.set(`link:${shortCode}`, link, 86400);

    return link;
  }

  /**
   * Find a link by its short code using the Cache-Aside Pattern
   * 1. Check Redis memory cache (<1ms)
   * 2. On miss, fallback to PostgreSQL (~20-80ms) and populate Redis
   * @param {string} shortCode
   * @returns {Promise<{link: Object|null, source: 'cache'|'database'}>}
   */
  async getLinkByCode(shortCode) {
    const cacheKey = `link:${shortCode}`;

    // 1. Cache Lookup (Cache Hit)
    const cachedLink = await cacheService.get(cacheKey);
    if (cachedLink) {
      return { link: cachedLink, source: 'cache' };
    }

    // 2. Database Fallback (Cache Miss)
    const sql = `
      SELECT id, short_code, original_url, created_at
      FROM links
      WHERE short_code = $1;
    `;

    const result = await query(sql, [shortCode]);
    const link = result.rows[0] || null;

    // 3. Populate Redis Cache on Miss
    if (link) {
      await cacheService.set(cacheKey, link, 86400); // 24 hours TTL
    }

    return { link, source: 'database' };
  }

  /**
   * Fetch aggregated analytics for a specific shortCode
   * @param {string} shortCode
   */
  async getLinkAnalytics(shortCode) {
    const totalSql = `SELECT COUNT(*) as total_clicks FROM clicks WHERE short_code = $1;`;
    const deviceSql = `
      SELECT device, COUNT(*) as count 
      FROM clicks 
      WHERE short_code = $1 
      GROUP BY device 
      ORDER BY count DESC;
    `;
    const browserSql = `
      SELECT browser, COUNT(*) as count 
      FROM clicks 
      WHERE short_code = $1 
      GROUP BY browser 
      ORDER BY count DESC;
    `;
    const countrySql = `
      SELECT country, COUNT(*) as count 
      FROM clicks 
      WHERE short_code = $1 
      GROUP BY country 
      ORDER BY count DESC;
    `;
    const recentClicksSql = `
      SELECT id, ip_address, country, city, device, browser, referrer, created_at 
      FROM clicks 
      WHERE short_code = $1 
      ORDER BY created_at DESC 
      LIMIT 20;
    `;

    const [totalRes, deviceRes, browserRes, countryRes, recentRes] = await Promise.all([
      query(totalSql, [shortCode]),
      query(deviceSql, [shortCode]),
      query(browserSql, [shortCode]),
      query(countrySql, [shortCode]),
      query(recentClicksSql, [shortCode]),
    ]);

    return {
      shortCode,
      totalClicks: parseInt(totalRes.rows[0].total_clicks, 10),
      devices: deviceRes.rows,
      browsers: browserRes.rows,
      countries: countryRes.rows,
      recentClicks: recentRes.rows,
    };
  }
}

module.exports = new LinkService();
