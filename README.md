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
- [ ] **Lesson 11: Redis High-Speed Caching & Rate Limiting**
  * Implement Cache-Aside pattern (cache redirects in Redis).
  * Build a sliding-window rate limiter in Redis to protect routes from DDOS.
- [ ] **Lesson 12: BullMQ Queue & Analytics Background Worker**
  * Split application into API and Worker containers.
  * Queue analytics payloads in Redis; process geo-locations in the worker.
  * Implement database batching to write click events in bulk.
- [ ] **Lesson 13: Next.js Frontend Integration & Supabase Auth**
  * Containerize Next.js with development volume mounts.
  * Integrate Supabase JWT Auth to secure endpoints.
  * Build interactive dashboard charts for link analytics.

### Phase 4: Horizontal Scaling & DevOps Observability
- [ ] **Lesson 14: Replicas & Load Balancing with Nginx**
  * Scale Express backend containers to 3 replicas.
  * Configure Nginx as a reverse proxy round-robin load balancer.
- [ ] **Lesson 15: Observability, Circuit Breakers, & GitHub Actions CI/CD**
  * Export application metrics via Prometheus.
  * Build Grafana dashboards to monitor latency (p95/p99) and queue backlogs.
  * Implement Circuit Breakers to handle database outages gracefully.
  * Set up GitHub Actions CI/CD to build and push production Docker Hub images.

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
