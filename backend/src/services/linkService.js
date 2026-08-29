const { query } = require('../config/db');
const { generateShortCode } = require('../utils/codeGenerator');
const cacheService = require('./cacheService');
const { cacheHitsTotal, cacheMissesTotal } = require('../metrics/prometheus');
const { createCircuitBreaker } = require('./circuitBreaker');

/**
 * Raw database query function for fetching a link by shortCode
 */
async function queryLinkFromDb(shortCode) {
  const sql = `
    SELECT id, short_code, original_url, created_at
    FROM links
    WHERE short_code = $1;
  `;
  const result = await query(sql, [shortCode]);
  return result.rows[0] || null;
}

// Wrap database query with Circuit Breaker resilience
const dbLinkBreaker = createCircuitBreaker(queryLinkFromDb, 'postgres_links_query');
dbLinkBreaker.fallback(() => null);

/**
 * Service for Link operations with Redis Cache-Aside optimization, Circuit Breakers & Analytics
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
   * List all short links with their total click count
   * @param {number} limit
   * @param {number} offset
   */
  async listLinks(limit = 50, offset = 0) {
    const sql = `
      SELECT 
        l.id, 
        l.short_code, 
        l.original_url, 
        l.created_at, 
        l.updated_at,
        COUNT(c.id) as click_count
      FROM links l
      LEFT JOIN clicks c ON l.id = c.link_id OR l.short_code = c.short_code
      GROUP BY l.id, l.short_code, l.original_url, l.created_at, l.updated_at
      ORDER BY l.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await query(sql, [limit, offset]);
    return result.rows;
  }

  /**
   * Find a link by its short code using Cache-Aside + Circuit Breaker
   * @param {string} shortCode
   * @returns {Promise<{link: Object|null, source: 'cache'|'database'}>}
   */
  async getLinkByCode(shortCode) {
    const cacheKey = `link:${shortCode}`;

    // 1. Cache Lookup (Cache Hit)
    const cachedLink = await cacheService.get(cacheKey);
    if (cachedLink) {
      cacheHitsTotal.inc({ cache_key_prefix: 'link' });
      return { link: cachedLink, source: 'cache' };
    }

    // 2. Database Fallback (Cache Miss) protected by Circuit Breaker
    cacheMissesTotal.inc({ cache_key_prefix: 'link' });

    let link = null;
    try {
      link = await dbLinkBreaker.fire(shortCode);
    } catch (err) {
      console.error('[LinkService] Circuit breaker caught DB error:', err.message);
      link = null;
    }

    // 3. Populate Redis Cache on Miss
    if (link) {
      await cacheService.set(cacheKey, link, 86400); // 24 hours TTL
    }

    return { link, source: 'database' };
  }

  /**
   * Delete a short link by code & invalidate cache
   * @param {string} shortCode
   */
  async deleteLink(shortCode) {
    const sql = `DELETE FROM links WHERE short_code = $1 RETURNING id;`;
    const result = await query(sql, [shortCode]);
    await cacheService.del(`link:${shortCode}`);
    return result.rowCount > 0;
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
