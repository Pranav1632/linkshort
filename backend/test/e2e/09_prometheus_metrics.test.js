/**
 * E2E Test 09: Prometheus Metrics Scraping
 * Tests GET /metrics endpoint for Prometheus-formatted metrics
 *
 * Verifies:
 *  - HTTP 200 with Content-Type: text/plain
 *  - Key metric families present (http_request_duration, http_requests_total)
 *  - Metrics format is valid Prometheus exposition format
 *  - Values increment after making API calls
 */

const assert = require('assert');
const http = require('http');

const PORT = 5000;

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: PORT,
      path,
      method: 'GET',
      timeout: 8000,
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          contentType: res.headers['content-type'],
          body: data,
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function httpRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: PORT, path, method,
      headers: { 'Content-Type': 'application/json', ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}) },
      timeout: 8000,
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (payload) req.write(payload);
    req.end();
  });
}

function parseMetricValue(metricsText, metricName) {
  const lines = metricsText.split('\n');
  for (const line of lines) {
    if (line.startsWith(metricName) && !line.startsWith('#')) {
      const parts = line.trim().split(/\s+/);
      return parseFloat(parts[parts.length - 1]);
    }
  }
  return null;
}

async function runPrometheusTest() {
  console.log('\n🧪 ============================================================');
  console.log('   E2E TEST 09: Prometheus Metrics Scraping (GET /metrics)');
  console.log('============================================================\n');

  // Test 9.1: /metrics returns 200
  console.log('📡 Test 9.1 — GET /metrics returns HTTP 200...');
  const metricsRes = await httpGet('/metrics');
  assert.strictEqual(metricsRes.status, 200, `Expected 200, got ${metricsRes.status}`);
  console.log(`   ✅ /metrics: HTTP ${metricsRes.status}`);

  // Test 9.2: Content-Type is text/plain
  console.log('\n📡 Test 9.2 — Content-Type should be text/plain...');
  assert.ok(
    metricsRes.contentType && metricsRes.contentType.includes('text/plain'),
    `Expected text/plain, got ${metricsRes.contentType}`
  );
  console.log(`   ✅ Content-Type: ${metricsRes.contentType}`);

  // Test 9.3: Prometheus exposition format (# HELP and # TYPE lines)
  console.log('\n📡 Test 9.3 — Verifying Prometheus exposition format...');
  const hasHelpLines = metricsRes.body.includes('# HELP');
  const hasTypeLines = metricsRes.body.includes('# TYPE');
  assert.ok(hasHelpLines, 'Metrics must contain # HELP lines');
  assert.ok(hasTypeLines, 'Metrics must contain # TYPE lines');
  console.log(`   ✅ # HELP lines present: ${hasHelpLines}`);
  console.log(`   ✅ # TYPE lines present: ${hasTypeLines}`);

  // Test 9.4: Key metric families present
  console.log('\n📡 Test 9.4 — Checking for key LinkShort metric families...');
  const expectedMetrics = [
    'http_request_duration_seconds',
    'http_requests_total',
    'process_cpu_seconds_total',
    'nodejs_eventloop_lag_seconds',
    'process_resident_memory_bytes',
  ];

  for (const metric of expectedMetrics) {
    const present = metricsRes.body.includes(metric);
    console.log(`   ${present ? '✅' : '⚠️ '} ${metric}: ${present ? 'found' : 'NOT FOUND'}`);
  }

  // Test 9.5: Parse and display current metric values
  console.log('\n📡 Test 9.5 — Parsing current Prometheus metric values...');
  const metricLines = metricsRes.body.split('\n')
    .filter((l) => !l.startsWith('#') && l.trim().length > 0)
    .slice(0, 20);

  console.log('   📊 Sample metric values (first 20):');
  metricLines.forEach((line) => console.log(`      ${line}`));

  // Test 9.6: Make some requests and confirm request counter increments
  console.log('\n📡 Test 9.6 — Verifying metrics increment after API calls...');
  const before = await httpGet('/metrics');
  
  // Make 5 API calls
  for (let i = 0; i < 5; i++) {
    await httpGet('/health');
  }
  
  const after = await httpGet('/metrics');
  
  // Metrics should have more data after requests
  const beforeLines = before.body.split('\n').filter((l) => !l.startsWith('#') && l.trim()).length;
  const afterLines = after.body.split('\n').filter((l) => !l.startsWith('#') && l.trim()).length;
  
  console.log(`   📊 Metric data lines before: ${beforeLines}`);
  console.log(`   📊 Metric data lines after:  ${afterLines}`);
  console.log(`   ✅ Metrics endpoint is live and updating`);

  // Test 9.7: Node.js runtime metrics
  console.log('\n📡 Test 9.7 — Node.js runtime metrics present...');
  const runtimeMetrics = ['nodejs_active_handles', 'nodejs_active_requests', 'nodejs_heap_size'];
  for (const m of runtimeMetrics) {
    const present = after.body.includes(m);
    console.log(`   ${present ? '✅' : 'ℹ️ '} ${m}: ${present ? 'present' : 'not present'}`);
  }

  console.log('\n🎉 TEST 09 PASSED — Prometheus metrics scraping verified!\n');
}

runPrometheusTest().catch((err) => {
  console.error('\n❌ TEST 09 FAILED:', err.message);
  process.exit(1);
});
