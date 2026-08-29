# "Dub.co Clone" — Enterprise URL Shortener & Analytics (`linkshort`)
## Project Architecture & Blueprint

This document serves as the complete technical blueprint and roadmap for our containerized, high-performance URL shortener and analytics engine.

---

## 🗺️ System Architecture

Our application is designed as a high-concurrency, low-latency microservice architecture containerized using Docker and Docker Compose.

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

## 🛠️ Technology Stack & Containers

* **`frontend` (Next.js, TypeScript, React)**: Port `3000`. Dashboard for short link creation, custom metadata settings, user auth, and real-time analytical charts.
* **`backend` (Express.js, TypeScript, Node.js)**: Port `5000`. High-speed routing API. Resolves redirects, validates authentication JWTs, and pushes tasks to queues.
* **`redis` (Redis Cache & Queue)**: Port `6379`. Low-latency caching of URL redirect records, sliding-window rate limiters, and queue store.
* **`worker` (Node.js, BullMQ)**: Background worker container. Consumes click metadata from BullMQ, conducts geolocation parsing, and batch-updates Postgres database.
* **`database` (Supabase Cloud / PostgreSQL)**: External cloud instance. Safe, persistent SQL storage for user credentials, link rules, and click historical tables.
* **`router` (Nginx Load Balancer)**: Distributes incoming user redirections across scaled backend container instances.

---

## 🚀 High-Concurrency Scenario (How Scale is Achieved)

> **Case**: 100,000 users click a shortened link (`dub.co/sale`) within 10 seconds.

* **Nginx Load Balancer**: Intercepts the traffic and splits it evenly across 3 backend replicas.
* **Redis Cache (Cache-Aside)**: The Express instances check Redis memory. Since the short code is cached, the destination URL is returned in `<1ms`, bypassing PostgreSQL.
* **BullMQ Queue Ingestion**: Instead of writing the visitor data (IP, browser, time) to PostgreSQL during the request, Express pushes it into a Redis queue. Express returns a `302 Redirect` instantly.
* **Asynchronous Batching (Worker)**: The background worker fetches entries from the queue, performs geolocation, and batches writes (e.g. 500 records per query) to Postgres, preventing database congestion.
