# 🚀 LinkShort — Enterprise Distributed URL Shortener & Analytics Engine

> **A high-concurrency, low-latency, fault-tolerant URL Shortener and Real-Time Analytics Platform inspired by [Dub.co](https://dub.co) and [Clerk.com](https://clerk.com).**

---

## 📑 Table of Contents
- [🌟 System Highlights](#-system-highlights)
- [🗺️ Distributed Architecture Diagram](#️-distributed-architecture-diagram)
- [🛠️ Multi-Container Microservices](#️-multi-container-microservices)
- [📚 Complete 15-Lesson Engineering Curriculum](#-complete-15-lesson-engineering-curriculum)
- [⚡ Quick Start & Deployment Guide](#-quick-start--deployment-guide)
- [📡 API Specification & Reference](#-api-specification--reference)
- [🧪 Testing & Verification Guide](#-testing--verification-guide)
- [🛡️ Resilience & High-Availability Features](#️-resilience--high-availability-features)
- [📈 Observability & Prometheus Metrics](#-observability--prometheus-metrics)
- [📦 Database Migrations & Supabase CLI](#-database-migrations--supabase-cli)
- [🔄 CI/CD Pipeline Workflow](#-cicd-pipeline-workflow)

---

## 🌟 System Highlights

- **⚡ Sub-Millisecond 302 Redirection**: Implemented using the **Redis Cache-Aside Pattern** (`<1ms` memory lookup latency).
- **🛡️ Sliding-Window Rate Limiting**: Precision traffic-shaping using Redis Sorted Sets (`ZADD`, `ZRANGEBYSCORE`) to prevent scrapers and DDoS attacks.
- **📥 Asynchronous Analytics Ingestion**: **BullMQ** message queue decouples HTTP redirects from analytics writes—zero latency penalty for visitors.
- **🕵️ Deep Visitor Telemetry**: Dedicated background worker microservice parses `User-Agent` (Browser, OS, Device Type) and resolves IP Geolocation.
- **🎨 Modern Web Dashboard**: Built with **Next.js 14 App Router**, **TailwindCSS**, **Recharts**, and styled after **Clerk.com**.
- **🔐 Clerk Authentication**: Integrated user login, session management, and protected routes via `@clerk/nextjs`.
- **⚖️ 3-Replica Horizontal Scaling**: Express backend scaled to 3 concurrent container replicas fronted by an API Gateway Load Balancer with Docker internal DNS discovery.
- **🛡️ Opossum Circuit Breakers**: Automatic fast-fail protection preventing database outages from freezing application threads.
- **📊 Prometheus Observability**: Custom metrics exporter tracking request rates, p95/p99 latency histograms, and cache hit ratios.
- **🤖 GitHub Actions CI/CD**: Automated unit test execution and multi-container Docker image verification on every commit.

---

## 🗺️ Distributed Architecture Diagram

```text
                                  ┌──────────────────────────┐
                                  │     Next.js Frontend     │  (Port 3000)
                                  │   [Clerk Auth & Charts]  │
                                  └─────────────┬────────────┘
                                                │
                                                │ HTTP / REST / WebSockets
                                                ▼
                                  ┌──────────────────────────┐
                                  │    API Gateway Balancer  │  (Port 5000)
                                  │  [Round-Robin DNS Proxy] │
                                  └──────┬───────┼───────┬───┘
                                         │       │       │
                     ┌───────────────────┘       │       └───────────────────┐
                     ▼                           ▼                           ▼
        ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────┐
        │   Backend Replica 1    │  │   Backend Replica 2    │  │   Backend Replica 3    │
        │ [Cache-Aside + Breaker]│  │ [Cache-Aside + Breaker]│  │ [Cache-Aside + Breaker]│
        └────────────┬───────────┘  └────────────┬───────────┘  └────────────┬───────────┘
                     │                           │                           │
                     └───────────────────────────┼───────────────────────────┘
                                                 │
                                                 ▼
                                     ┌───────────────────────┐
                                     │         Redis         │  (Port 6379)
                                     │  - <1ms Cache Memory  │
                                     │  - BullMQ Job Queue   │
                                     │  - Sliding Rate Limit │
                                     └───────────┬───────────┘
                                                 │
                                                 │ Async Click Events
                                                 ▼
                                     ┌───────────────────────┐
                                     │    Worker Container   │  (GeoIP & UserAgent Parser)
                                     └───────────┬───────────┘
                                                 │
                                                 │ Batch SQL Writes
                                                 ▼
                                     ┌───────────────────────┐
                                     │  Supabase PostgreSQL  │  (Cloud Database)
                                     │  [RLS & Connection]   │
                                     └───────────────────────┘
```

---

## 🛠️ Multi-Container Microservices

| Service | Container Name | Technology | Port / Mode | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | `linkshort-frontend` | Next.js 14, React, TailwindCSS, Recharts, Clerk | `3000:3000` | User dashboard, link manager, interactive charts, and auth modal. |
| **Gateway** | `linkshort-gateway` | Node.js, `http-proxy` | `5000:5000` | Ingress reverse proxy, round-robin load balancer, DNS service discovery. |
| **Backend** | `linkshort-backend-1..3` | Express.js, `pg.Pool`, `prom-client`, `opossum` | `5000` *(Internal)* | REST API endpoints, link generation, Cache-Aside logic, circuit breakers. |
| **Worker** | `linkshort-worker` | Node.js, BullMQ, `ua-parser-js`, `pg` | *Internal Daemon* | Asynchronous analytics queue consumer, device/browser parser, SQL persistence. |
| **Redis** | `linkshort-redis` | Redis 7 Alpine | `6379:6379` | In-memory key-value cache, BullMQ message broker, sliding rate-limit storage. |
| **Database** | *External Cloud* | Supabase PostgreSQL 15 | `6543` *(Pooler)* | Persistent relational storage for links, metadata, and visitor analytics. |

---

## 📚 Complete 15-Lesson Engineering Curriculum

### Phase 1: Foundations & Architecture Planning
- [x] **Lesson 1: System Design & Distributed Requirements**: Mapped out high-concurrency throughput targets, latency budgets, and Dub.co feature parity.
- [x] **Lesson 2: Relational Data Modeling**: Designed `links` (indexed `short_code`) and `clicks` (time-series visitor telemetry) schema.
- [x] **Lesson 3: Docker & Multi-Stage Image Strategy**: Formulated containerization strategy using lightweight Alpine base images and non-root users.
- [x] **Lesson 4: Project Scaffold & Environment Architecture**: Initialized clean modular folder structure and environment variable isolation.

### Phase 2: Core Microservices & Containerization
- [x] **Lesson 5: Express Backend REST API**: Implemented Base62 short URL generation and routing pipelines.
- [x] **Lesson 6: Docker Compose Multi-Container Orchestration**: Configured Docker Compose network bridges and volume persistency.
- [x] **Lesson 7: Production Container Optimization**: Implemented multi-stage builder stages and pruned dev dependencies.
- [x] **Lesson 8: Security & Non-Root Containers**: Enforced least-privilege container execution policies.
- [x] **Lesson 9: Advanced Healthchecks**: Configured inter-service dependency health conditions (`condition: service_healthy`).

### Phase 3: Construction & Scale
- [x] **Lesson 10: Supabase DB & Connection Pooling**:
  - Configured `pg.Pool` with SSL (`rejectUnauthorized: false`) connecting to Supabase PgBouncer pooler.
  - Multi-service health monitoring (`GET /health`) checking DB and Redis.
- [x] **Lesson 11: Redis High-Speed Caching & Rate Limiting**:
  - Implemented **Cache-Aside Pattern** dropping redirection latency to `<1ms` (`X-Cache-Source: cache`).
  - Implemented Redis **Sliding-Window Rate Limiter** using Sorted Sets (30 req/min for link creation, 120 req/min for redirects).
- [x] **Lesson 12: BullMQ Queue & Analytics Background Worker**:
  - Decoupled redirects from analytics using a Redis BullMQ `click-events` queue.
  - Background worker parses User-Agent device/browser and persists click events.
  - Aggregated analytics reporting endpoint (`GET /api/v1/links/:shortCode/analytics`).
- [x] **Lesson 13: Next.js Frontend Integration & Clerk Authentication**:
  - Built Next.js 14 Web Dashboard with Clerk.com / Dub.co inspired aesthetic.
  - Integrated Clerk Authentication (`@clerk/nextjs`) with `<SignIn />`, `<SignUp />`, and `<UserButton />`.
  - Added interactive Recharts analytics modal and link management table.

### Phase 4: Horizontal Scaling & DevOps Observability
- [x] **Lesson 14: Replicas & Load Balancing with Gateway**:
  - Scaled Express backend to 3 concurrent replicas (`backend-1`, `backend-2`, `backend-3`).
  - Implemented Round-Robin load balancing and sub-second failover.
  - Added `X-Served-By` container identification header.
- [x] **Lesson 15: Observability, Circuit Breakers, & GitHub Actions CI/CD**:
  - Exported Prometheus metrics (`GET /metrics`) tracking RPS, p95/p99 latency histograms, and cache ratios.
  - Implemented Opossum Circuit Breakers for database failover and fast-fail protection.
  - Automated Unit Test Suite (`npm test`) and GitHub Actions CI/CD pipeline (`.github/workflows/ci.yml`).

---

## ⚡ Quick Start & Deployment Guide

### 1. Clone Repository
```bash
git clone https://github.com/Pranav1632/linkshort.git
cd linkshort
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=5000
REDIS_URL=redis://linkshort-redis:6379
NODE_ENV=development
DATABASE_URL=postgresql://postgres.rajdhymaysjzgujdtxbd:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### 3. Launch Full Multi-Container Cluster (with 3 Replicas)
```bash
docker compose up --build --scale backend=3 -d
```

### 4. Access Services
- 🌐 **Web Dashboard UI**: [http://localhost:3000](http://localhost:3000)
- 🔌 **API Gateway Load Balancer**: [http://localhost:5000](http://localhost:5000)
- 🩺 **Health Monitoring**: [http://localhost:5000/health](http://localhost:5000/health)
- 📊 **Prometheus Metrics**: [http://localhost:5000/metrics](http://localhost:5000/metrics)

---

## 📡 API Specification & Reference

### 1. `POST /api/v1/links` — Create Short Link
- **Headers**: `Content-Type: application/json`
- **Rate Limit**: 30 requests / minute
- **Request Body**:
  ```json
  {
    "originalUrl": "https://github.com",
    "customCode": "gh"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "status": "success",
    "message": "Short link created successfully",
    "data": {
      "id": "1",
      "short_code": "gh",
      "original_url": "https://github.com",
      "created_at": "2026-08-30T00:00:00.000Z"
    }
  }
  ```

---

### 2. `GET /:shortCode` — Ultra-Fast 302 Redirection
- **Description**: Redirects visitor to destination URL. Dispatches asynchronous click event to BullMQ.
- **Rate Limit**: 120 requests / minute
- **Response Headers**:
  - `Location`: `https://github.com`
  - `X-Cache-Source`: `cache` *(<1ms RAM)*
  - `X-Served-By`: `88a87d9ff6d1` *(Backend Replica ID)*

---

### 3. `GET /api/v1/links/:shortCode/analytics` — Aggregated Analytics
- **Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "data": {
      "shortCode": "gh",
      "totalClicks": 142,
      "devices": [
        { "device": "Desktop", "count": "94" },
        { "device": "mobile", "count": "48" }
      ],
      "browsers": [
        { "browser": "Chrome", "count": "82" },
        { "browser": "Safari", "count": "38" },
        { "browser": "Firefox", "count": "22" }
      ],
      "countries": [
        { "country": "US", "count": "110" },
        { "country": "IN", "count": "32" }
      ],
      "recentClicks": [
        {
          "id": "142",
          "ip_address": "::ffff:172.20.0.1",
          "country": "US",
          "city": "San Francisco",
          "device": "Desktop",
          "browser": "Chrome",
          "referrer": "https://twitter.com",
          "created_at": "2026-08-30T01:10:00.000Z"
        }
      ]
    }
  }
  ```

---

### 4. `GET /metrics` — Prometheus Scraper Feed
- **Format**: OpenMetrics / Prometheus Text format
- **Metrics Exported**:
  - `linkshort_http_requests_total{method, route, status_code}`
  - `linkshort_http_request_duration_seconds{le, method, route, status_code}`
  - `linkshort_cache_hits_total{cache_key_prefix}`
  - `linkshort_cache_misses_total{cache_key_prefix}`
  - `linkshort_circuit_breaker_state{service}`

---

## 🧪 Testing & Verification Guide

### 1. Test Round-Robin Load Balancing
Run 6 requests in PowerShell to watch the replicas rotate:
```powershell
1..6 | ForEach-Object { (curl.exe -i -s http://localhost:5000/health | Select-String "X-Served-By") }
```
**Output**:
```text
x-served-by: 88a87d9ff6d1 (Replica 1)
x-served-by: 3053394abbc7 (Replica 2)
x-served-by: 70fbe4ae6718 (Replica 3)
x-served-by: 88a87d9ff6d1 (Replica 1)
x-served-by: 3053394abbc7 (Replica 2)
x-served-by: 70fbe4ae6718 (Replica 3)
```

### 2. Test Automated Unit Tests
```bash
cd backend
npm test
```

---

## 🛡️ Resilience & High-Availability Features

1. **Zero-Downtime Failover**:
   If a backend replica crashes, the API Gateway immediately catches the TCP disconnect and retries the next healthy replica in under 5 milliseconds.
2. **Graceful Cache Degradation**:
   If Supabase PostgreSQL experiences a cloud outage, the Opossum Circuit Breaker trips to `OPEN` state, serving all active short links directly from Redis cache without throwing 500 errors.

---

## 📦 Database Migrations & Supabase CLI

All database tables and indexes are version-controlled in [`supabase/migrations/`](supabase/migrations/):
- `20260830000001_create_links_table.sql`
- `20260830000002_create_clicks_table.sql`

To apply migrations via the Supabase CLI:
```bash
npx supabase link --project-ref rajdhymaysjzgujdtxbd
npx supabase db push
```

---

## 🔄 CI/CD Pipeline Workflow

Every commit to `main` executes the automated pipeline in [`.github/workflows/ci.yml`](.github/workflows/ci.yml):

```text
  Git Push / PR to main
            │
            ├──► Job 1: Run Unit Tests & Linting (Node.js 22)
            │
            └──► Job 2: Build & Verify Docker Multi-Container Images (Parallel Buildx)
```

---

## 👨‍💻 Project Repository

- **GitHub Remote**: [`https://github.com/Pranav1632/linkshort.git`](https://github.com/Pranav1632/linkshort.git)
- **Author**: Pranav ([@Pranav1632](https://github.com/Pranav1632))
- **License**: MIT
