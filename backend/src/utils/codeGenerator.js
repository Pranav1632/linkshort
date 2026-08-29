const crypto = require('crypto');

/**
 * Generate a random URL-safe short code
 * @param {number} bytes
 * @returns {string}
 */
function generateShortCode(bytes = 3) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = {
  generateShortCode,
};
