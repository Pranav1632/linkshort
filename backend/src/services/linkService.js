const { query } = require('../config/db');
const { generateShortCode } = require('../utils/codeGenerator');

/**
 * Service for Link creation and retrieval operations
 */
class LinkService {
  /**
   * Create a new shortened link
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
    return result.rows[0];
  }

  /**
   * Find a link by its short code
   * @param {string} shortCode
   * @returns {Promise<Object|null>}
   */
  async getLinkByCode(shortCode) {
    const sql = `
      SELECT id, short_code, original_url, created_at
      FROM links
      WHERE short_code = $1;
    `;

    const result = await query(sql, [shortCode]);
    return result.rows[0] || null;
  }
}

module.exports = new LinkService();
