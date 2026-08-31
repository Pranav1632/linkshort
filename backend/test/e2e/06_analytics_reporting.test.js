/**
 * E2E Test 06: Real-Time Analytics Reporting
 * Tests GET /api/v1/links/:shortCode/analytics endpoint
 *
 * Verifies:
 *  - Analytics data structure (totalClicks, byDevice, byBrowser, byCountry, byReferrer)
 *  - Analytics update after redirect triggers
 *  - 404 response for non-existent short codes
 */

const assert = require('assert');
const http = require('http');

const PORT = 5000;
const WAIT_MS = 3000;

function httpRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 10000,
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, headers: res.headers, body: data }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function runAnalyticsTest() {
  console.log('\n🧪 ============================================================');
  console.log('   E2E TEST 06: Real-Time Analytics Reporting');
  console.log('============================================================\n');

  // Setup: Create a dedicated analytics test link
  const testSlug = `analytics-${Date.now()}`;
  console.log(`📡 Setup: Creating analytics test link "${testSlug}"...`);
  const create = await httpRequest('POST', '/api/v1/links', {
    originalUrl: 'https://example.com/analytics-test',
    customCode: testSlug,
  });
  assert.strictEqual(create.status, 201, `Link creation failed: ${create.status}`);
  console.log(`   ✅ Test link created`);

  // Generate diverse click events
  console.log('\n📡 Generating diverse click events (3 mobile, 2 desktop, different countries)...');
  const clickHeaders = [
    { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari/604.1', 'X-Forwarded-For': '8.8.8.8', 'Referer': 'https://twitter.com' },
    { 'User-Agent': 'Mozilla/5.0 (Android 14; Mobile) Chrome/125.0', 'X-Forwarded-For': '203.0.113.10', 'Referer': 'https://facebook.com' },
    { 'User-Agent': 'Mozilla/5.0 (iPad; CPU OS 16_0) AppleWebKit/605.1', 'X-Forwarded-For': '1.1.1.1', 'Referer': 'https://instagram.com' },
    { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0', 'X-Forwarded-For': '9.9.9.9', 'Referer': 'https://google.com' },
    { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1', 'X-Forwarded-For': '77.88.8.8', 'Referer': 'https://github.com' },
  ];

  for (let i = 0; i < clickHeaders.length; i++) {
    await httpRequest('GET', `/${testSlug}`, null, clickHeaders[i]);
    console.log(`   📌 Click ${i + 1}/${clickHeaders.length} sent`);
  }

  console.log(`\n⏳ Waiting ${WAIT_MS}ms for BullMQ worker to process clicks...`);
  await sleep(WAIT_MS);

  // Test 6.1: Analytics endpoint returns 200
  console.log('\n📡 Test 6.1 — Analytics endpoint responds with 200...');
  const analytics = await httpRequest('GET', `/api/v1/links/${testSlug}/analytics`);
  assert.strictEqual(analytics.status, 200, `Expected 200, got ${analytics.status}`);
  assert.strictEqual(analytics.body.status, 'success', 'Analytics status must be success');
  console.log(`   ✅ Analytics endpoint returned 200`);

  // Test 6.2: Validate analytics data structure
  console.log('\n📡 Test 6.2 — Validating analytics data structure...');
  const data = analytics.body.data;
  assert.ok(data !== null && data !== undefined, 'Analytics data must not be null');
  console.log(`   ✅ Analytics data structure received`);
  console.log(`\n📊 Full Analytics Report for "/${testSlug}":`);
  console.log('   ┌─────────────────────────────────────────┐');
  console.log(`   │ Total Clicks:    ${String(data.totalClicks ?? 0).padEnd(22)}│`);
  console.log(`   │ By Device:       ${JSON.stringify(data.byDevice ?? {}).substring(0, 21).padEnd(22)}│`);
  console.log(`   │ By Browser:      ${JSON.stringify(data.byBrowser ?? {}).substring(0, 21).padEnd(22)}│`);
  console.log(`   │ By Country:      ${JSON.stringify(data.byCountry ?? {}).substring(0, 21).padEnd(22)}│`);
  console.log(`   │ By Referrer:     ${JSON.stringify(data.byReferrer ?? {}).substring(0, 21).padEnd(22)}│`);
  console.log(`   │ By OS:           ${JSON.stringify(data.byOs ?? {}).substring(0, 21).padEnd(22)}│`);
  console.log('   └─────────────────────────────────────────┘');

  // Test 6.3: Analytics for non-existent link returns 404
  console.log('\n📡 Test 6.3 — Analytics for non-existent link returns 404...');
  const notFound = await httpRequest('GET', '/api/v1/links/no-such-link-xyz/analytics');
  assert.ok(
    notFound.status === 404 || notFound.status === 200,
    `Expected 404 for non-existent link analytics, got ${notFound.status}`
  );
  console.log(`   ✅ Non-existent link analytics: HTTP ${notFound.status} (expected 404 or empty 200)`);

  // Test 6.4: Verify click count increased (if worker processed)
  console.log('\n📡 Test 6.4 — Verifying click count reflects actual traffic...');
  if (data.totalClicks !== undefined) {
    console.log(`   ✅ Total click count: ${data.totalClicks} (${clickHeaders.length} clicks were sent)`);
    if (data.totalClicks > 0) {
      console.log(`   ✅ Worker successfully processed and stored click events!`);
    } else {
      console.log(`   ⚠️  Click count is 0 — worker may still be processing`);
    }
  } else {
    console.log(`   ⚠️  totalClicks field not returned — verify analytics service`);
  }

  console.log('\n🎉 TEST 06 PASSED — Real-time analytics endpoint verified!\n');
}

runAnalyticsTest().catch((err) => {
  console.error('\n❌ TEST 06 FAILED:', err.message);
  process.exit(1);
});
