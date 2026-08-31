# 🧪 LinkShort — Complete Manual Testing Guide

> **Platform:** Dub.co + Clerk.com Clone | Microservices Architecture
> **Stack:** Next.js 14 · Express · Redis · BullMQ · Supabase · Docker

---

## ⚙️ SETUP — Start All Services First

```bash
# Start all containers with 3 backend replicas
docker compose up -d --scale backend=3

# Verify everything is running
docker compose ps
```

**Expected:**
```
NAME                  STATUS          PORTS
linkshort-backend-1   Up (healthy)    5000/tcp
linkshort-backend-2   Up (healthy)    5000/tcp
linkshort-backend-3   Up (healthy)    5000/tcp
linkshort-gateway     Up              0.0.0.0:5000->5000/tcp
linkshort-frontend    Up              0.0.0.0:3000->3000/tcp
linkshort-redis       Up (healthy)    0.0.0.0:6379->6379/tcp
linkshort-worker      Up
```

---

## 🔵 TEST 01 — Multi-Service Health Check

### Command
```bash
curl -s http://localhost:5000/gateway-health | jq .
```
```bash
curl -s http://localhost:5000/health | jq .
```

### Expected Output — Gateway Health
```json
{
  "status": "healthy",
  "service": "api-gateway-load-balancer",
  "activeReplicasCount": 3,
  "replicas": [
    "http://172.20.0.4:5000",
    "http://172.20.0.5:5000",
    "http://172.20.0.6:5000"
  ]
}
```

### Expected Output — Backend Health
```json
{
  "status": "healthy",
  "timestamp": "2026-08-31T18:36:16.794Z",
  "services": {
    "api": "healthy",
    "database": "healthy",
    "cache": "healthy",
    "circuitBreakers": {
      "postgres_links_query": {
        "closed": true,
        "opened": false,
        "halfOpen": false
      }
    }
  }
}
```

### Also Check Headers
```bash
curl -I http://localhost:5000/health
```
**Look for:**
```
X-Served-By: c7a3f7188747        ← container hostname (changes per replica)
X-Gateway-Route: round-robin
```

---

## 🔵 TEST 02 — Link Creation & Validation

### 2a. Create Link (Auto Short Code)
```bash
curl -s -X POST http://localhost:5000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://github.com/Pranav1632/linkshort"}' | jq .
```
**Expected:**
```json
{
  "status": "success",
  "message": "Short link created successfully",
  "data": {
    "id": 42,
    "short_code": "aX9kR2",
    "original_url": "https://github.com/Pranav1632/linkshort",
    "created_at": "2026-08-31T18:00:00.000Z"
  }
}
```
**HTTP Status:** `201 Created`

---

### 2b. Create Link (Custom Slug)
```bash
curl -s -X POST http://localhost:5000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://google.com", "customCode": "my-link"}' | jq .
```
**Expected:**
```json
{
  "status": "success",
  "data": {
    "short_code": "my-link",
    "original_url": "https://google.com"
  }
}
```
**HTTP Status:** `201 Created`

---

### 2c. Duplicate Slug → 409 Conflict
```bash
curl -s -X POST http://localhost:5000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com", "customCode": "my-link"}' | jq .
```
**Expected:**
```json
{
  "status": "error",
  "error": "Short code already in use. Please choose another code."
}
```
**HTTP Status:** `409 Conflict`

---

### 2d. Missing URL → 400 Bad Request
```bash
curl -s -X POST http://localhost:5000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```
**Expected:**
```json
{
  "status": "error",
  "error": "originalUrl is required"
}
```
**HTTP Status:** `400 Bad Request`

---

### 2e. Invalid URL Format → 400 Bad Request
```bash
curl -s -X POST http://localhost:5000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "not-a-valid-url"}' | jq .
```
**Expected:**
```json
{
  "status": "error",
  "error": "Invalid URL format. Include http:// or https://"
}
```
**HTTP Status:** `400 Bad Request`

---

### 2f. List All Links
```bash
curl -s "http://localhost:5000/api/v1/links?limit=5&offset=0" | jq .
```
**Expected:**
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "short_code": "aX9kR2",
      "original_url": "https://github.com/...",
      "created_at": "2026-08-31T..."
    }
  ]
}
```
**HTTP Status:** `200 OK`

---

## 🔵 TEST 03 — 302 Redirection & Cache Performance

### 3a. First Hit (DB Miss)
```bash
# Replace YOUR_CODE with a short code you created above
curl -v http://localhost:5000/YOUR_CODE 2>&1 | grep -E "< HTTP|Location|X-Cache"
```
**Expected:**
```
< HTTP/1.1 302 Found
< Location: https://github.com/Pranav1632/linkshort
< X-Cache-Source: db          ← first hit, fetched from database
```

---

### 3b. Second Hit (Cache HIT)
```bash
curl -v http://localhost:5000/YOUR_CODE 2>&1 | grep -E "< HTTP|Location|X-Cache"
```
**Expected:**
```
< HTTP/1.1 302 Found
< Location: https://github.com/Pranav1632/linkshort
< X-Cache-Source: cache       ← served from Redis instantly!
```

---

### 3c. Latency Benchmark (10 hits)
```bash
for i in {1..10}; do
  time curl -s -o /dev/null http://localhost:5000/YOUR_CODE
done
```
**Expected:** Each request under `50ms`, most under `20ms`

---

### 3d. Non-Existent Code → 404
```bash
curl -v http://localhost:5000/this-doesnt-exist 2>&1 | grep "HTTP"
```
**Expected:**
```
< HTTP/1.1 404 Not Found
```

---

## 🔵 TEST 04 — Redis Rate Limiter (HTTP 429)

### Fire 40 rapid POST requests (limit is 30/min)
```bash
for i in {1..40}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:5000/api/v1/links \
    -H "Content-Type: application/json" \
    -d '{"originalUrl": "https://example.com"}')
  echo "Request $i: HTTP $STATUS"
done
```
**Expected:**
```
Request 1:  HTTP 201     ✅
Request 2:  HTTP 201     ✅
...
Request 30: HTTP 201     ✅
Request 31: HTTP 429     🚫  ← RATE LIMITED!
Request 32: HTTP 429     🚫
...
Request 40: HTTP 429     🚫
```

### Check Rate Limit Response Body
```bash
curl -s -X POST http://localhost:5000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com"}' | jq .
```
**Expected (when rate limited):**
```json
{
  "status": "error",
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "retryAfter": 60
}
```

### Check Rate Limit Headers
```bash
curl -I -X POST http://localhost:5000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://example.com"}'
```
**Expected Headers:**
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29     ← decrements each request
X-RateLimit-Reset: 1756789200
Retry-After: 60               ← only appears on 429
```

---

## 🔵 TEST 05 — BullMQ Queue & Worker

### 5a. Trigger Mobile Click (queues a job)
```bash
curl -v http://localhost:5000/YOUR_CODE \
  -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1" \
  -H "X-Forwarded-For: 8.8.8.8" 2>&1 | grep "HTTP"
```
**Expected:** `HTTP/1.1 302 Found`

---

### 5b. Trigger Desktop Click
```bash
curl -v http://localhost:5000/YOUR_CODE \
  -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36" \
  -H "X-Forwarded-For: 1.1.1.1" 2>&1 | grep "HTTP"
```
**Expected:** `HTTP/1.1 302 Found`

---

### 5c. Watch Worker Container Logs (Live!)
```bash
docker logs linkshort-worker --follow --tail 20
```
**Expected output (live):**
```
[Worker] 🚀 BullMQ Click Event Worker started. Listening for jobs...
[Worker] Processing click job #24 for shortCode "my-link"...
[Worker] Click job #24 processed successfully. Inserted Click ID: 24
[Worker] Job #24 completed.
[Worker] Processing click job #25 for shortCode "my-link"...
[Worker] Click job #25 processed successfully. Inserted Click ID: 25
[Worker] Job #25 completed.
```

---

### 5d. Verify Redis Queue
```bash
docker exec linkshort-redis redis-cli LLEN bull:click-events:wait
docker exec linkshort-redis redis-cli LLEN bull:click-events:completed
```
**Expected:**
```
(integer) 0     ← queue empty (all processed)
(integer) 5     ← 5 jobs completed
```

---

## 🔵 TEST 06 — Real-Time Analytics

### Get Analytics for a Link
```bash
curl -s http://localhost:5000/api/v1/links/YOUR_CODE/analytics | jq .
```
**Expected:**
```json
{
  "status": "success",
  "data": {
    "totalClicks": 5,
    "byDevice": {
      "mobile": 3,
      "desktop": 2
    },
    "byBrowser": {
      "Safari": 2,
      "Chrome": 3
    },
    "byCountry": {
      "US": 2,
      "AU": 1,
      "IN": 1,
      "GB": 1
    },
    "byReferrer": {
      "twitter.com": 1,
      "google.com": 1
    },
    "byOs": {
      "iOS": 2,
      "Windows": 2,
      "macOS": 1
    }
  }
}
```
**HTTP Status:** `200 OK`

---

## 🔵 TEST 07 — Round-Robin Load Balancer

### Send 9 requests and watch replicas rotate
```bash
for i in {1..9}; do
  curl -s -I http://localhost:5000/health | grep "X-Served-By"
done
```
**Expected (perfect rotation):**
```
X-Served-By: aabd2bb41bad     ← backend-1
X-Served-By: 7ab31e4992c9     ← backend-2
X-Served-By: ee6b9fc86742     ← backend-3
X-Served-By: aabd2bb41bad     ← backend-1 (cycles back)
X-Served-By: 7ab31e4992c9     ← backend-2
X-Served-By: ee6b9fc86742     ← backend-3
X-Served-By: aabd2bb41bad     ← backend-1
X-Served-By: 7ab31e4992c9     ← backend-2
X-Served-By: ee6b9fc86742     ← backend-3
```

### Check Gateway Route Header
```bash
curl -I http://localhost:5000/health | grep "X-Gateway-Route"
```
**Expected:**
```
X-Gateway-Route: round-robin
```

---

## 🔵 TEST 08 — Chaos Failover (Zero Downtime)

### Step 1 — Confirm 3 replicas running
```bash
docker ps --filter "name=linkshort-backend" --format "table {{.Names}}\t{{.Status}}"
```
**Expected:**
```
NAMES                   STATUS
linkshort-backend-1     Up 10 minutes (healthy)
linkshort-backend-2     Up 10 minutes (healthy)
linkshort-backend-3     Up 10 minutes (healthy)
```

### Step 2 — Stop one replica (simulate crash)
```bash
docker stop linkshort-backend-1
```
**Expected:** `linkshort-backend-1`

### Step 3 — Immediately fire requests (must NOT fail!)
```bash
for i in {1..10}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
  REPLICA=$(curl -s -I http://localhost:5000/health | grep "X-Served-By" | awk '{print $2}')
  echo "Request $i: HTTP $STATUS | Replica: $REPLICA"
done
```
**Expected (zero downtime!):**
```
Request 1:  HTTP 200 | Replica: 7ab31e4992c9   ← backend-2
Request 2:  HTTP 200 | Replica: ee6b9fc86742   ← backend-3
Request 3:  HTTP 200 | Replica: 7ab31e4992c9   ← backend-2
Request 4:  HTTP 200 | Replica: ee6b9fc86742   ← backend-3
...all 10 succeed, backend-1 never appears!
```

### Step 4 — Restart the stopped container
```bash
docker start linkshort-backend-1
sleep 10
curl -I http://localhost:5000/health | grep "X-Served-By"
```
**Expected:** backend-1 hostname appears again in rotation

---

## 🔵 TEST 09 — Prometheus Metrics

### Raw Metrics
```bash
curl -s http://localhost:5000/metrics | head -50
```
**Expected:**
```
# HELP linkshort_http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE linkshort_http_request_duration_seconds histogram
linkshort_http_request_duration_seconds_bucket{route="/health",method="GET",status_code="200",le="0.005"} 12

# HELP linkshort_process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE linkshort_process_cpu_seconds_total counter
linkshort_process_cpu_seconds_total 2.456762

# HELP linkshort_process_resident_memory_bytes Resident memory size in bytes.
linkshort_process_resident_memory_bytes 88477696

# HELP linkshort_nodejs_eventloop_lag_seconds Lag of event loop in seconds.
linkshort_nodejs_eventloop_lag_p99_seconds 0.011354111
```

### Check Specific Metrics
```bash
# CPU usage
curl -s http://localhost:5000/metrics | grep "cpu_seconds_total"

# Memory usage
curl -s http://localhost:5000/metrics | grep "resident_memory"

# HTTP request count
curl -s http://localhost:5000/metrics | grep "http_requests_total"

# Event loop lag
curl -s http://localhost:5000/metrics | grep "eventloop_lag_mean"
```

---

## 🔵 TEST 10 — Frontend Dashboard

### Check Frontend Is Running
```bash
curl -I http://localhost:3000
```
**Expected:**
```
HTTP/1.1 307 Temporary Redirect      ← Next.js redirecting to Clerk sign-in
Location: /sign-in
```

### Open in Browser
Navigate to: **http://localhost:3000**

**Expected:**
- Redirected to Clerk sign-in page
- `https://clerk.linkshort.dev/sign-in` or `/sign-in`
- Sign in with your Clerk account
- Dashboard loads with:
  - ✅ Link creation form
  - ✅ Links table with analytics
  - ✅ Recharts graphs (clicks over time)
  - ✅ User avatar (Clerk UserButton)

### Check CORS from Frontend Origin
```bash
curl -s -I http://localhost:5000/api/v1/links \
  -H "Origin: http://localhost:3000" | grep -i "access-control"
```
**Expected:**
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

---

## 🔵 BONUS — Redis Direct Inspection

### Ping Redis
```bash
docker exec linkshort-redis redis-cli PING
```
**Expected:** `PONG`

### View Cached Short Links
```bash
docker exec linkshort-redis redis-cli KEYS "link:*"
```
**Expected:**
```
1) "link:my-link"
2) "link:aX9kR2"
```

### View Rate Limiter Keys
```bash
docker exec linkshort-redis redis-cli KEYS "rl:*"
```
**Expected:**
```
1) "rl:create-link:192.168.x.x"
2) "rl:redirect:172.20.0.1"
```

### Inspect Sliding Window Entries
```bash
docker exec linkshort-redis redis-cli ZRANGE "rl:create-link:YOUR_IP" 0 -1 WITHSCORES
```
**Expected:** Timestamps showing recent request history

---

## 📋 Quick Reference — All Endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `GET` | `/gateway-health` | Gateway + replica status |
| `GET` | `/health` | Full stack health (API+Redis+DB+Breakers) |
| `POST` | `/api/v1/links` | Create short link |
| `GET` | `/api/v1/links` | List all links |
| `GET` | `/api/v1/links/:code` | Get link details + cache source |
| `DELETE` | `/api/v1/links/:code` | Delete a link |
| `GET` | `/api/v1/links/:code/analytics` | Click analytics |
| `GET` | `/:code` | 302 Redirect (main use case) |
| `GET` | `/metrics` | Prometheus metrics |

---

## ✅ Quick Smoke Test (5 commands, 30 seconds)

```bash
# 1. Health
curl -s http://localhost:5000/health | jq .status

# 2. Create
curl -s -X POST http://localhost:5000/api/v1/links \
  -H "Content-Type: application/json" \
  -d '{"originalUrl":"https://github.com","customCode":"test123"}' | jq .data.short_code

# 3. Redirect
curl -I http://localhost:5000/test123 2>&1 | grep "HTTP\|Location\|X-Cache"

# 4. Analytics
curl -s http://localhost:5000/api/v1/links/test123/analytics | jq .data.totalClicks

# 5. Metrics
curl -s http://localhost:5000/metrics | grep "http_requests_total" | head -3
```
