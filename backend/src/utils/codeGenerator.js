const crypto = require('crypto');

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate a random URL-safe Base62 short code
 * @param {number} length - Desired character length
 * @returns {string}
 */
function generateShortCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE62[bytes[i] % 62];
  }
  return result;
}

module.exports = {
  generateShortCode,
};
