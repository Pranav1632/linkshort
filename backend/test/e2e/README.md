# E2E Test Suite — LinkShort URL Shortener & Analytics Platform

> **Full End-to-End (E2E) Test Suite** for the LinkShort platform — a Dub.co + Clerk.com clone built on a microservices architecture.

## 📦 Test Scenarios

| # | Test File | Scenario | Target |
|---|-----------|----------|--------|
| 01 | `01_health_check.test.js` | Multi-Service Health Check | `GET /health`, `GET /gateway-health` |
| 02 | `02_link_creation.test.js` | Link Creation & Validation | `POST /api/v1/links` |
| 03 | `03_redirection_performance.test.js` | Sub-ms 302 Redirection + Cache | `GET /:shortCode` |
| 04 | `04_rate_limiter_stress.test.js` | Redis Sliding-Window Rate Limiter | Rapid-fire → HTTP 429 |
| 05 | `05_bullmq_worker.test.js` | BullMQ Queue + Worker Ingestion | Mobile/Desktop UA + GeoIP |
| 06 | `06_analytics_reporting.test.js` | Real-Time Analytics Reporting | `GET /api/v1/links/:code/analytics` |
| 07 | `07_load_balancer.test.js` | Round-Robin Load Balancer | `X-Served-By` header distribution |
| 08 | `08_chaos_failover.test.js` | Fault-Tolerance Chaos Test | Stop 1 replica → verify failover |
| 09 | `09_prometheus_metrics.test.js` | Prometheus Metrics Scraping | `GET /metrics` |
| 10 | `10_frontend_dashboard.test.js` | Frontend Dashboard Verification | `http://localhost:3000` |

## 🚀 Running the Tests

### Prerequisites
Make sure all services are running:
```bash
docker compose up -d --scale backend=3
```

### Run All 10 Tests
```bash
node backend/test/e2e/run_all.js
```

### Run Individual Tests
```bash
# Test 01: Health Check
node backend/test/e2e/01_health_check.test.js

# Test 02: Link Creation
node backend/test/e2e/02_link_creation.test.js

# Test 03: Redirection Performance
node backend/test/e2e/03_redirection_performance.test.js

# Test 04: Rate Limiter Stress
node backend/test/e2e/04_rate_limiter_stress.test.js

# Test 05: BullMQ Worker
node backend/test/e2e/05_bullmq_worker.test.js

# Test 06: Analytics
node backend/test/e2e/06_analytics_reporting.test.js

# Test 07: Load Balancer
node backend/test/e2e/07_load_balancer.test.js

# Test 08: Chaos Failover
node backend/test/e2e/08_chaos_failover.test.js

# Test 09: Prometheus Metrics
node backend/test/e2e/09_prometheus_metrics.test.js

# Test 10: Frontend Dashboard
node backend/test/e2e/10_frontend_dashboard.test.js
```

### Custom Gateway URL
```bash
GATEWAY_URL=http://localhost:5000 node backend/test/e2e/run_all.js
```

## 🏗️ Architecture Under Test

```
Browser (Port 3000)
   └── Next.js 14 Dashboard (Clerk Auth, TailwindCSS, Recharts)
          │
          ▼
API Gateway (Port 5000)
  Round-Robin Load Balancer → [Backend-1] [Backend-2] [Backend-3]
          │                         │
          │                    Redis (Port 6379)
          │                   ┌─────────────┐
          │                   │ Cache-Aside │
          │                   │ Rate Limiter│
          │                   │ BullMQ Queue│
          │                   └─────────────┘
          │                         │
          │                    Worker Container
          │                  (UA Parse + GeoIP)
          │                         │
          └──────────────────────── ▼
                            Supabase PostgreSQL
                          (Connection Pooler :6543)
```

## 📊 Expected Test Results

| Scenario | Pass Condition |
|----------|----------------|
| Health Check | All 4 services report healthy |
| Link Creation | 201 for valid URLs, 400/409 for invalid |
| Redirection | 302 with `X-Cache-Source: cache` on 2nd hit |
| Rate Limiter | HTTP 429 after 60 req/min from same IP |
| BullMQ Worker | Click jobs processed, device types logged |
| Analytics | Click counts and device breakdown in response |
| Load Balancer | ≥2 different `X-Served-By` values in 30 requests |
| Chaos Failover | ≥80% uptime when 1 of 3 replicas is stopped |
| Prometheus | Valid exposition format with all key metrics |
| Frontend | HTTP 200 with Next.js identifiers present |

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GATEWAY_URL` | `http://localhost:5000` | API Gateway URL |
| `WORKER_CONTAINER` | `linkshort-worker` | Docker worker container name |
