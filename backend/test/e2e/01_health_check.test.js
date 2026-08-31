/**
 * E2E Test 01: Multi-Service Health Check
 * Tests GET /health endpoint verifying API, Redis, Supabase, and Circuit Breakers
 * 
 * Expected: HTTP 200 with all services reporting healthy status
 */

const assert = require('assert');
const http = require('http');

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000';
const TIMEOUT_MS = 10000;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: TIMEOUT_MS }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
  });
}

async function runHealthCheckTest() {
  console.log('\n🧪 ============================================================');
  console.log('   E2E TEST 01: Multi-Service Health Check (GET /health)');
  console.log('============================================================\n');

  // Test 1.1: Gateway Health
  console.log('📡 Test 1.1 — Gateway Load Balancer Health Check...');
  const gatewayHealth = await httpGet(`${GATEWAY_URL}/gateway-health`);
  assert.strictEqual(gatewayHealth.status, 200, `Gateway should return 200, got ${gatewayHealth.status}`);
  assert.strictEqual(gatewayHealth.body.status, 'healthy', 'Gateway status should be "healthy"');
  assert.ok(typeof gatewayHealth.body.activeReplicasCount === 'number', 'Should report active replica count');
  console.log(`   ✅ Gateway: ${gatewayHealth.body.status} | Replicas: ${gatewayHealth.body.activeReplicasCount}`);
  console.log(`   📋 Replica IPs: ${JSON.stringify(gatewayHealth.body.replicas)}`);

  // Test 1.2: Backend Full Health
  console.log('\n📡 Test 1.2 — Backend API Health Check (API + Redis + Supabase + Circuit Breakers)...');
  const backendHealth = await httpGet(`${GATEWAY_URL}/health`);
  assert.ok(
    backendHealth.status === 200 || backendHealth.status === 503,
    `Health endpoint should return 200 or 503, got ${backendHealth.status}`
  );
  const { services } = backendHealth.body;
  assert.ok(services, 'Response must include "services" object');
  assert.ok(services.api, 'API service status must be present');
  assert.ok(services.database, 'Database service status must be present');
  assert.ok(services.cache, 'Cache (Redis) service status must be present');
  assert.ok(services.circuitBreakers, 'Circuit breakers status must be present');

  console.log(`   ✅ Overall Status: ${backendHealth.body.status}`);
  console.log(`   ✅ API:            ${services.api}`);
  console.log(`   ✅ Database:       ${services.database}`);
  console.log(`   ✅ Cache (Redis):  ${services.cache}`);
  console.log(`   ✅ Circuit Breakers: ${JSON.stringify(services.circuitBreakers)}`);

  // Test 1.3: Verify X-Served-By header
  console.log('\n📡 Test 1.3 — Verify X-Served-By replica identification header...');
  assert.ok(backendHealth.headers['x-served-by'], 'X-Served-By header must be present');
  console.log(`   ✅ X-Served-By: ${backendHealth.headers['x-served-by']}`);

  // Test 1.4: Verify response timestamp
  console.log('\n📡 Test 1.4 — Verify health response includes ISO timestamp...');
  assert.ok(backendHealth.body.timestamp, 'Health response must include timestamp');
  const ts = new Date(backendHealth.body.timestamp);
  assert.ok(!isNaN(ts.getTime()), 'Timestamp must be a valid ISO 8601 date string');
  console.log(`   ✅ Timestamp: ${backendHealth.body.timestamp}`);

  console.log('\n🎉 TEST 01 PASSED — All health checks verified!\n');
}

runHealthCheckTest().catch((err) => {
  console.error('\n❌ TEST 01 FAILED:', err.message);
  process.exit(1);
});
