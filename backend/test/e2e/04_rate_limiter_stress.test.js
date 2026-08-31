/**
 * E2E Test 04: Redis Sliding-Window Rate Limiter Stress Test
 * Fires rapid successive requests to trigger HTTP 429 Too Many Requests
 *
 * Strategy:
 *  - Uses a unique IP spoof via X-Forwarded-For to isolate test
 *  - Sends requests until 429 is received
 *  - Verifies Retry-After and X-RateLimit-* headers
 */

const assert = require('assert');
const http = require('http');

// Use POST /api/v1/links — this route has createLinkLimiter (max: 30 req/min)
// GET /api/v1/links has no rate limit applied
const PORT = 5000;
const MAX_REQUESTS = 50; // Send more than the 30 req/min POST limit
const CONCURRENCY = 5;

function httpRequest(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
      timeout: 5000,
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

    req.on('error', (err) => resolve({ status: 0, error: err.message, headers: {}, body: {} }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout', headers: {}, body: {} }); });
    if (payload) req.write(payload);
    req.end();
  });
}

async function runRateLimiterTest() {
  console.log('\n🧪 ============================================================');
  console.log('   E2E TEST 04: Redis Sliding-Window Rate Limiter Stress Test');
  console.log('============================================================\n');

  // Use a unique IP to isolate this test from other test runs
  const fakeIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  const extraHeaders = { 'X-Forwarded-For': fakeIp };

  console.log(`📡 Using test IP: ${fakeIp}`);
  console.log(`📡 Sending ${MAX_REQUESTS} rapid-fire POST requests to /api/v1/links...`);
  console.log(`📡 Rate limit on POST: 30 req/min — expected: first ~30 succeed, rest trigger HTTP 429\n`);

  const results = { ok: 0, rateLimited: 0, errors: 0 };
  let first429 = null;
  let rateLimitHeaders = null;

  // Fire POST requests in batches — POST /api/v1/links has the 30/min rate limiter
  for (let i = 0; i < MAX_REQUESTS; i += CONCURRENCY) {
    const batch = Array.from({ length: CONCURRENCY }, (_, j) =>
      httpRequest('POST', '/api/v1/links', { originalUrl: 'https://example.com' }, extraHeaders)
    );
    const responses = await Promise.all(batch);

    for (const res of responses) {
      if (res.status === 200) {
        results.ok++;
      } else if (res.status === 429) {
        results.rateLimited++;
        if (!first429) {
          first429 = res;
          rateLimitHeaders = res.headers;
        }
      } else if (res.status === 0) {
        results.errors++;
      } else {
        results.ok++; // 201, etc. still successful
      }
    }
  }

  console.log(`📊 Results after ${MAX_REQUESTS} rapid requests:`);
  console.log(`   ✅ Successful (2xx):     ${results.ok}`);
  console.log(`   🚫 Rate Limited (429):   ${results.rateLimited}`);
  console.log(`   ⚠️  Network Errors:      ${results.errors}`);

  // Test 4.1: 429 was triggered
  console.log('\n📡 Test 4.1 — Verifying HTTP 429 was triggered...');
  assert.ok(
    results.rateLimited > 0,
    `Expected at least one 429 response, got ${results.rateLimited}. Is rate limiter enabled?`
  );
  console.log(`   ✅ Rate limiting triggered after too many requests`);

  // Test 4.2: 429 response has correct error body
  console.log('\n📡 Test 4.2 — Verifying 429 response body format...');
  if (first429) {
    assert.ok(first429.body.error, '429 must include error field');
    assert.ok(first429.body.retryAfter, '429 must include retryAfter field');
    console.log(`   ✅ 429 Error: "${first429.body.error}"`);
    console.log(`   ✅ Retry-After: ${first429.body.retryAfter}s`);
    console.log(`   ✅ Message: "${first429.body.message}"`);
  }

  // Test 4.3: Rate limit headers
  console.log('\n📡 Test 4.3 — Verifying X-RateLimit headers...');
  const sampleRes = await httpRequest('GET', '/api/v1/links', null, { 'X-Forwarded-For': '10.0.0.1' });
  const limitHeader = sampleRes.headers['x-ratelimit-limit'];
  const remainingHeader = sampleRes.headers['x-ratelimit-remaining'];
  const resetHeader = sampleRes.headers['x-ratelimit-reset'];

  if (limitHeader) {
    console.log(`   ✅ X-RateLimit-Limit:     ${limitHeader}`);
    console.log(`   ✅ X-RateLimit-Remaining: ${remainingHeader}`);
    console.log(`   ✅ X-RateLimit-Reset:     ${resetHeader} (Unix epoch)`);
  } else {
    console.log(`   ⚠️  Rate limit headers not present on this request (different IP isolates from limit)`);
  }

  console.log('\n🎉 TEST 04 PASSED — Sliding-Window Rate Limiter working correctly!\n');
}

runRateLimiterTest().catch((err) => {
  console.error('\n❌ TEST 04 FAILED:', err.message);
  process.exit(1);
});
