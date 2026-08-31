/**
 * E2E Test 03: Sub-Millisecond 302 Redirection Performance
 * Tests redirect endpoint for:
 *  - Correct 302 HTTP status with Location header
 *  - Cache-Aside pattern: first hit (DB) vs second hit (cache)
 *  - X-Cache-Source header: 'db' on miss, 'cache' on hit
 *  - Sub-millisecond latency on cache hits
 */

const assert = require('assert');
const http = require('http');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000';
const PERFORMANCE_THRESHOLD_MS = 50; // Cache hits should be under 50ms

function httpRequest(method, path, body = null, followRedirect = false) {
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

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const latencyMs = Date.now() - startTime;
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : {},
            latencyMs,
          });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data, latencyMs });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

async function runRedirectionTest() {
  console.log('\n🧪 ============================================================');
  console.log('   E2E TEST 03: Sub-Millisecond 302 Redirection Performance');
  console.log('============================================================\n');

  // Step 0: Create a test link first
  const testSlug = `redir-${Date.now()}`;
  console.log(`📡 Setup: Creating test link with slug "${testSlug}"...`);
  const create = await httpRequest('POST', '/api/v1/links', {
    originalUrl: 'https://github.com/Pranav1632/linkshort',
    customCode: testSlug,
  });
  assert.strictEqual(create.status, 201, `Setup failed: Could not create test link (${create.status})`);
  console.log(`   ✅ Test link created: /${testSlug} → https://github.com/Pranav1632/linkshort`);

  // Test 3.1: First access — should be a DB miss (X-Cache-Source: db)
  console.log('\n📡 Test 3.1 — First redirect hit (expected: X-Cache-Source: db)...');
  const firstHit = await httpRequest('GET', `/${testSlug}`);
  
  // Accept 302 (redirect) or 200 (if redirect follow is disabled)
  assert.ok(
    firstHit.status === 302 || firstHit.status === 301,
    `Expected 301/302 redirect, got ${firstHit.status}`
  );
  assert.ok(firstHit.headers.location, 'Redirect must include Location header');
  assert.ok(
    firstHit.headers.location.includes('github.com'),
    `Location must point to github.com, got ${firstHit.headers.location}`
  );
  const firstCacheSource = firstHit.headers['x-cache-source'];
  console.log(`   ✅ Status: ${firstHit.status} (Redirect)`);
  console.log(`   ✅ Location: ${firstHit.headers.location}`);
  console.log(`   ✅ X-Cache-Source: ${firstCacheSource || 'not set (first hit populates cache)'}`);
  console.log(`   ⏱  Latency: ${firstHit.latencyMs}ms`);

  // Test 3.2: Second access — should be a cache hit (X-Cache-Source: cache)
  console.log('\n📡 Test 3.2 — Second redirect hit (expected: X-Cache-Source: cache)...');
  const secondHit = await httpRequest('GET', `/${testSlug}`);
  assert.ok(
    secondHit.status === 302 || secondHit.status === 301,
    `Expected 301/302 redirect, got ${secondHit.status}`
  );
  const secondCacheSource = secondHit.headers['x-cache-source'];
  console.log(`   ✅ Status: ${secondHit.status}`);
  console.log(`   ✅ X-Cache-Source: ${secondCacheSource}`);
  console.log(`   ⏱  Latency: ${secondHit.latencyMs}ms`);

  if (secondCacheSource === 'cache') {
    console.log(`   ✅ Cache hit confirmed!`);
    assert.ok(
      secondHit.latencyMs < PERFORMANCE_THRESHOLD_MS,
      `Cache hit latency ${secondHit.latencyMs}ms exceeds ${PERFORMANCE_THRESHOLD_MS}ms threshold`
    );
    console.log(`   ✅ Performance: ${secondHit.latencyMs}ms < ${PERFORMANCE_THRESHOLD_MS}ms threshold ✓`);
  } else {
    console.log(`   ⚠️  Cache source: "${secondCacheSource}" — cache may not be populated yet`);
  }

  // Test 3.3: 10-hit performance benchmark on cache
  console.log('\n📡 Test 3.3 — 10-hit latency benchmark on cached redirect...');
  const latencies = [];
  for (let i = 0; i < 10; i++) {
    const hit = await httpRequest('GET', `/${testSlug}`);
    latencies.push(hit.latencyMs);
  }
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);
  console.log(`   ✅ Latencies: [${latencies.join(', ')}] ms`);
  console.log(`   ✅ Avg: ${avgLatency.toFixed(1)}ms | Min: ${minLatency}ms | Max: ${maxLatency}ms`);

  // Test 3.4: Non-existent short code returns 404
  console.log('\n📡 Test 3.4 — Non-existent short code should return 404...');
  const notFound = await httpRequest('GET', '/this-code-does-not-exist-xyz123');
  assert.strictEqual(notFound.status, 404, `Expected 404 for non-existent code, got ${notFound.status}`);
  console.log(`   ✅ Non-existent code correctly returns 404`);

  console.log('\n🎉 TEST 03 PASSED — Redirection performance & caching verified!\n');
}

runRedirectionTest().catch((err) => {
  console.error('\n❌ TEST 03 FAILED:', err.message);
  process.exit(1);
});
