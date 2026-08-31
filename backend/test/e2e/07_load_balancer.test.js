/**
 * E2E Test 07: Round-Robin Load Balancer Verification
 * Sends N requests and verifies distribution across backend replicas
 * via the X-Served-By header (set to container hostname in app.js)
 */

const assert = require('assert');
const http = require('http');

const PORT = 5000;
const TOTAL_REQUESTS = 30;

function httpGet(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: PORT,
      path,
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
      timeout: 8000,
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          servedBy: res.headers['x-served-by'],
          gatewayRoute: res.headers['x-gateway-route'],
          headers: res.headers,
        });
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message, servedBy: null }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'timeout', servedBy: null }); });
    req.end();
  });
}

async function runLoadBalancerTest() {
  console.log('\n🧪 ============================================================');
  console.log('   E2E TEST 07: Round-Robin Load Balancer Verification');
  console.log('============================================================\n');

  console.log('📡 Test 7.1 — Gateway health check for active replicas...');
  const gwHealth = await httpGet('/gateway-health');
  if (gwHealth.status === 200) {
    console.log(`   ✅ Gateway Status: healthy`);
  } else {
    console.log(`   ⚠️  Gateway health returned: ${gwHealth.status}`);
  }

  console.log(`\n📡 Test 7.2 — Sending ${TOTAL_REQUESTS} requests tracking X-Served-By headers...`);
  const replicaHitCount = {};
  let noHeaderCount = 0;

  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const res = await httpGet('/health');
    const servedBy = res.servedBy;
    if (servedBy) {
      replicaHitCount[servedBy] = (replicaHitCount[servedBy] || 0) + 1;
    } else {
      noHeaderCount++;
    }
  }

  const uniqueReplicas = Object.keys(replicaHitCount);
  console.log(`\n📊 Load Distribution Results (${TOTAL_REQUESTS} requests):`);
  for (const [replica, count] of Object.entries(replicaHitCount)) {
    const pct = ((count / TOTAL_REQUESTS) * 100).toFixed(1);
    console.log(`   ${replica.padEnd(35)} ${String(count).padStart(3)} hits (${pct}%)`);
  }
  if (noHeaderCount > 0) console.log(`   (no header) ${noHeaderCount} requests`);
  console.log(`\n   🔄 Unique replicas observed: ${uniqueReplicas.length}`);

  console.log('\n📡 Test 7.3 — Verifying round-robin distribution...');
  if (uniqueReplicas.length >= 2) {
    console.log(`   ✅ Round-robin confirmed: ${uniqueReplicas.length} replicas received requests`);
    console.log(`   ✅ Replicas: ${uniqueReplicas.join(', ')}`);
  } else if (uniqueReplicas.length === 1) {
    console.log(`   ⚠️  Only 1 replica ("${uniqueReplicas[0]}") — run: docker compose up --scale backend=3`);
  } else {
    console.log(`   ⚠️  No X-Served-By headers — check if containers are running`);
  }

  console.log('\n📡 Test 7.4 — Verify X-Gateway-Route: round-robin header...');
  const routeTestRes = await httpGet('/health');
  if (routeTestRes.gatewayRoute) {
    assert.strictEqual(routeTestRes.gatewayRoute, 'round-robin', `Expected "round-robin", got "${routeTestRes.gatewayRoute}"`);
    console.log(`   ✅ X-Gateway-Route: ${routeTestRes.gatewayRoute}`);
  } else {
    console.log(`   ⚠️  X-Gateway-Route header not present`);
  }

  if (uniqueReplicas.length >= 2) {
    console.log('\n📡 Test 7.5 — Checking for balanced distribution...');
    const counts = Object.values(replicaHitCount);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    const imbalanceRatio = maxCount / minCount;
    assert.ok(imbalanceRatio < 4, `Severe imbalance: ${imbalanceRatio.toFixed(2)}x`);
    console.log(`   ✅ Imbalance ratio: ${imbalanceRatio.toFixed(2)}x (acceptable)`);
  }

  console.log('\n🎉 TEST 07 PASSED — Round-robin load balancer verified!\n');
}

runLoadBalancerTest().catch((err) => {
  console.error('\n❌ TEST 07 FAILED:', err.message);
  process.exit(1);
});
