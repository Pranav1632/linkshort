const { UAParser } = require('ua-parser-js');
const { lookupIp } = require('../utils/geoLookup');
const { query } = require('../config/db');

/**
 * Process a single click event from the BullMQ queue
 * @param {Object} jobData
 */
async function processClickJob(jobData) {
  const { linkId, shortCode, ip, userAgent, referrer, clickedAt } = jobData;

  // 1. Parse User-Agent
  let browser = 'Chrome';
  let device = 'Desktop';

  if (userAgent) {
    try {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      browser = result.browser.name || 'Unknown';
      device = result.device.type || (result.os.name === 'Android' || result.os.name === 'iOS' ? 'Mobile' : 'Desktop');
    } catch (e) {
      console.warn('[Worker] User-agent parsing warning:', e.message);
    }
  }

  // 2. Parse IP Geolocation
  const { country, city } = lookupIp(ip);

  // 3. Persist click record to Supabase PostgreSQL
  const sql = `
    INSERT INTO clicks (link_id, short_code, ip_address, country, city, device, browser, referrer, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id;
  `;

  const values = [
    linkId || null,
    shortCode,
    ip || null,
    country,
    city,
    device,
    browser,
    referrer || null,
    clickedAt || new Date().toISOString(),
  ];

  const result = await query(sql, values);
  return result.rows[0];
}

module.exports = {
  processClickJob,
};
