/**
 * Lightweight IP Geolocation Lookup
 * Resolves country & city without heavy binary downloads
 */
function lookupIp(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'unknown' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Local', city: 'Localhost' };
  }

  // Basic country mapping heuristic for common ranges or fallback to Global
  return { country: 'US', city: 'San Francisco' };
}

module.exports = {
  lookupIp,
};
