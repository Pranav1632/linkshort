/**
 * E2E Test 02: Link Creation — Custom Slugs & Validation
 * Tests POST /api/v1/links with valid URLs, custom codes, and validation error cases
 *
 * Expected:
 *  - 201 on valid URL
 *  - 400 on missing URL
 *  - 400 on invalid URL format
 *  - 409 on duplicate custom slug
 */

const assert = require('assert');
const http = require('http');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000';

function httpRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

// Generate a unique slug for test isolation
const TEST_SLUG = `e2e-test-${Date.now()}`;

async function runLinkCreationTest() {
  console.log('\n🧪 ============================================================');
  console.log('   E2E TEST 02: Link Creation — Custom Slugs & Validation');
  console.log('============================================================\n');

  // Test 2.1: Create a link with auto-generated short code
  console.log('📡 Test 2.1 — Create link with auto-generated short code...');
  const autoLink = await httpRequest('POST', '/api/v1/links', {
    originalUrl: 'https://www.google.com',
  });
  assert.strictEqual(autoLink.status, 201, `Expected 201, got ${autoLink.status}`);
  assert.strictEqual(autoLink.body.status, 'success', 'Response status should be success');
  assert.ok(autoLink.body.data.short_code, 'Auto-generated short_code must exist');
  assert.ok(autoLink.body.data.original_url, 'original_url must be present in response');
  console.log(`   ✅ Created: short_code="${autoLink.body.data.short_code}", id="${autoLink.body.data.id}"`);

  // Test 2.2: Create link with custom slug
  console.log('\n📡 Test 2.2 — Create link with custom slug...');
  const customLink = await httpRequest('POST', '/api/v1/links', {
    originalUrl: 'https://github.com/Pranav1632/linkshort',
    customCode: TEST_SLUG,
  });
  assert.strictEqual(customLink.status, 201, `Expected 201 for custom slug, got ${customLink.status}`);
  assert.strictEqual(customLink.body.data.short_code, TEST_SLUG, `short_code should match custom slug`);
  console.log(`   ✅ Custom Slug Created: "${TEST_SLUG}"`);

  // Test 2.3: Duplicate slug returns 409 Conflict
  console.log('\n📡 Test 2.3 — Duplicate slug should return 409 Conflict...');
  const dupLink = await httpRequest('POST', '/api/v1/links', {
    originalUrl: 'https://example.com',
    customCode: TEST_SLUG,
  });
  assert.strictEqual(dupLink.status, 409, `Expected 409 on duplicate slug, got ${dupLink.status}`);
  console.log(`   ✅ Duplicate slug correctly rejected with 409`);

  // Test 2.4: Missing originalUrl returns 400
  console.log('\n📡 Test 2.4 — Missing originalUrl should return 400...');
  const missingUrl = await httpRequest('POST', '/api/v1/links', {});
  assert.strictEqual(missingUrl.status, 400, `Expected 400 for missing URL, got ${missingUrl.status}`);
  assert.ok(missingUrl.body.error, 'Error message must be present');
  console.log(`   ✅ Missing URL rejected: "${missingUrl.body.error}"`);

  // Test 2.5: Invalid URL format returns 400
  console.log('\n📡 Test 2.5 — Invalid URL format should return 400...');
  const invalidUrl = await httpRequest('POST', '/api/v1/links', {
    originalUrl: 'not-a-valid-url',
  });
  assert.strictEqual(invalidUrl.status, 400, `Expected 400 for invalid URL, got ${invalidUrl.status}`);
  console.log(`   ✅ Invalid URL rejected: "${invalidUrl.body.error}"`);

  // Test 2.6: List all links returns array
  console.log('\n📡 Test 2.6 — GET /api/v1/links should return paginated list...');
  const listLinks = await httpRequest('GET', '/api/v1/links');
  assert.strictEqual(listLinks.status, 200, `Expected 200, got ${listLinks.status}`);
  assert.ok(Array.isArray(listLinks.body.data), 'Links list must be an array');
  assert.ok(listLinks.body.data.length > 0, 'List must have at least 1 link');
  console.log(`   ✅ Listed ${listLinks.body.data.length} links`);

  // Store test slug for other tests
  console.log(`\n📎 Test slug for use in other tests: ${TEST_SLUG}`);
  console.log('\n🎉 TEST 02 PASSED — Link creation & validation verified!\n');
}

runLinkCreationTest().catch((err) => {
  console.error('\n❌ TEST 02 FAILED:', err.message);
  process.exit(1);
});
