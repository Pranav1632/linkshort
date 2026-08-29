# 🚀 LinkShort — Enterprise URL Shortener & Analytics

LinkShort is a containerized, high-concurrency, low-latency URL shortener and analytics engine inspired by Dub.co.

---

## 🗺️ Architecture Overview

```text
                                  ┌──────────────────────────┐
                                  │     Next.js Frontend     │  (Port 3000)
                                  └─────────────┬────────────┘
                                                │
                                                │ REST API / WebSockets
                                                ▼
                                  ┌──────────────────────────┐
                                  │    Express.js Backend    │  (Port 5000)
                                  └──────┬────────────┬──────┘
                                         │            │
                         Redis Queries / │            │ SQL / Auth
                         BullMQ Jobs     │            │
                                         ▼            ▼
                   ┌───────────────────────┐        ┌──────────────────────┐
                   │         Redis         │        │    Supabase Cloud    │  (External)
                   │      (Port 6379)      │        │ (Postgres / Storage) │
                   └───────────┬───────────┘        └──────────────────────┘
                               │
                               │ Job Ingestion
                               ▼
                   ┌───────────────────────┐
                   │    Worker Container   │  (Background Tasks)
                   └───────────────────────┘
```

---

## 🛠️ Step-by-Step Curriculum

### Phase 3: Construction & Scale
- [x] **Lesson 10: Supabase DB & Connection Pooling (Current Step)**
  * Established PostgreSQL schemas (`links`, `clicks` tables in `schema.sql`).
  * Configured `pg.Pool` connection pooling in Express.
  * Implemented link creation (`POST /api/v1/links`) and redirect (`GET /:shortCode`) APIs.
  * Added multi-service `/health` endpoint checking DB and Redis.
- [x] **Lesson 11: Redis High-Speed Caching & Rate Limiting**
  * Implemented Cache-Aside pattern (cache redirects in Redis, dropping lookup latency to <1ms).
  * Built a sliding-window rate limiter in Redis to protect routes from abuse.
  * Added `X-Cache-Source` and standard `X-RateLimit-*` response headers.
- [x] **Lesson 12: BullMQ Queue & Analytics Background Worker**
  * Split application into dedicated API and Worker containers.
  * Enqueued click analytics payloads asynchronously to Redis BullMQ on redirects without latency penalty.
  * Background worker consumes jobs, parses user-agent/device/browser, and persists click events to PostgreSQL.
  * Added link analytics endpoint (`GET /api/v1/links/:shortCode/analytics`).
- [x] **Lesson 13: Next.js Frontend Integration & Clerk Authentication**
  * Built Clerk.com / Dub.co inspired Next.js 14 Dashboard UI with TailwindCSS & Lucide icons.
  * Integrated Clerk Authentication (`@clerk/nextjs`) with `<SignIn />`, `<SignUp />`, and `<UserButton />`.
  * Implemented real-time interactive Analytics charts (Recharts) for Device breakdown, Browser breakdown, and live click stream.
  * Added Short Link creation form with instant copy-to-clipboard and custom slug support.
  * Containerized Next.js frontend in Docker Compose on port `3000`.

### Phase 4: Horizontal Scaling & DevOps Observability
- [x] **Lesson 14: Replicas & Load Balancing with Gateway / Nginx**
  * Scaled Express backend into 3 concurrent container replicas (`backend-1`, `backend-2`, `backend-3`).
  * Built an API Gateway & Load Balancer with Docker internal DNS discovery.
  * Implemented Round-Robin load distribution and automatic sub-second failover.
  * Added `X-Served-By` container hostname identification header.
- [x] **Lesson 15: Observability, Circuit Breakers, & GitHub Actions CI/CD**
  * Exported Prometheus metrics (`GET /metrics`) tracking RPS, p95/p99 latency histograms, and cache hit ratios.
  * Implemented Opossum Circuit Breaker for graceful fast-fail database protection.
  * Automated Unit Test Suite (`npm test`) validating short code generation and rate limiting.
  * Configured GitHub Actions CI/CD pipeline (`.github/workflows/ci.yml`) for automated testing and multi-container Docker image verification.

---

## ⚡ Quick Start

1. **Configure Environment Variables**:
   Update `.env` with your Supabase connection string.
2. **Execute Database Schema**:
   Run the SQL statements in `schema.sql` inside the Supabase SQL Editor.
3. **Start Containers**:
   ```bash
   docker compose up --build -d
   ```
4. **Check Health**:
   ```bash
   curl http://localhost:5000/health
   ```
