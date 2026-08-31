#!/usr/bin/env node
/**
 * LinkShort E2E Test Suite — Master Runner
 * Runs all 10 end-to-end test scenarios sequentially with colored output
 *
 * Usage:
 *   node backend/test/e2e/run_all.js
 *   GATEWAY_URL=http://localhost:5000 node backend/test/e2e/run_all.js
 */

const { execSync } = require('child_process');
const path = require('path');

const E2E_DIR = path.join(__dirname);

const TESTS = [
  { file: '01_health_check.test.js',        name: 'Multi-Service Health Check' },
  { file: '02_link_creation.test.js',        name: 'Link Creation & Validation' },
  { file: '03_redirection_performance.test.js', name: 'Sub-ms 302 Redirection Performance' },
  { file: '04_rate_limiter_stress.test.js',  name: 'Redis Sliding-Window Rate Limiter' },
  { file: '05_bullmq_worker.test.js',        name: 'BullMQ Queue & Worker Processing' },
  { file: '06_analytics_reporting.test.js',  name: 'Real-Time Analytics Reporting' },
  { file: '07_load_balancer.test.js',        name: 'Round-Robin Load Balancer' },
  { file: '08_chaos_failover.test.js',       name: 'Fault-Tolerance Chaos Test' },
  { file: '09_prometheus_metrics.test.js',   name: 'Prometheus Metrics Scraping' },
  { file: '10_frontend_dashboard.test.js',   name: 'Frontend Dashboard Verification' },
];

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

function printBanner() {
  console.log(`\n${BOLD}${CYAN}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║        LinkShort — Full E2E Test Suite (10 Scenarios)        ║');
  console.log('║      Dub.co + Clerk.com Clone | Full-Stack Microservices     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${RESET}`);
  console.log(`  Gateway:  ${process.env.GATEWAY_URL || 'http://localhost:5000'}`);
  console.log(`  Frontend: http://localhost:3000`);
  console.log(`  Redis:    redis://localhost:6379`);
  console.log(`  Time:     ${new Date().toISOString()}`);
}

async function runAllTests() {
  printBanner();

  const results = [];
  const startTotal = Date.now();

  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i];
    const testPath = path.join(E2E_DIR, test.file);
    const label = `[${String(i + 1).padStart(2, '0')}/${TESTS.length}] ${test.name}`;
    
    console.log(`\n${BOLD}${YELLOW}━━━ ${label} ━━━${RESET}`);
    
    const start = Date.now();
    let status = 'PASS';
    let errorMsg = '';

    try {
      execSync(`node "${testPath}"`, {
        stdio: 'inherit',
        timeout: 60000,
        env: { ...process.env },
      });
    } catch (err) {
      status = 'FAIL';
      errorMsg = err.message;
    }

    const duration = ((Date.now() - start) / 1000).toFixed(1);
    results.push({ name: test.name, status, duration, errorMsg });
  }

  const totalDuration = ((Date.now() - startTotal) / 1000).toFixed(1);
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  // Print summary
  console.log(`\n${BOLD}${CYAN}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    E2E TEST SUITE SUMMARY                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(`${RESET}`);

  results.forEach((r, i) => {
    const icon = r.status === 'PASS' ? `${GREEN}✅ PASS${RESET}` : `${RED}❌ FAIL${RESET}`;
    const num = String(i + 1).padStart(2, '0');
    console.log(`  ${num}. ${icon}  ${r.name.padEnd(40)} ${r.duration}s`);
    if (r.status === 'FAIL') console.log(`       ${RED}↳ ${r.errorMsg.split('\n')[0]}${RESET}`);
  });

  console.log(`\n${BOLD}  Results: ${GREEN}${passed} passed${RESET}${BOLD} / ${failed > 0 ? RED : GREEN}${failed} failed${RESET}${BOLD} — Total: ${totalDuration}s${RESET}`);

  if (failed === 0) {
    console.log(`\n${BOLD}${GREEN}🎉 ALL ${TESTS.length} E2E TESTS PASSED! Platform is fully operational.${RESET}\n`);
  } else {
    console.log(`\n${BOLD}${RED}⚠️  ${failed}/${TESTS.length} tests failed. Review logs above.${RESET}\n`);
    process.exit(1);
  }
}

runAllTests();
