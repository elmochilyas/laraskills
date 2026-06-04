# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K002 — Queue Driver Architecture
- **Knowledge ID:** K002
- **Difficulty Level:** Foundation
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues
  - Laravel Source — `Illuminate\Queue\*` (RedisQueue, DatabaseQueue, SqsQueue, etc.)

---

# Overview

Laravel ships six queue drivers plus a failover driver, all implementing the same `Queue` contract. The driver choice determines throughput, durability, operational complexity, and ecosystem compatibility (Horizon only works with Redis). **Redis** is the production default — high throughput with zero additional infrastructure if Redis is already used for cache. **SQS** suits AWS-native serverless architectures but loses Horizon compatibility. **Database** is a fallback for low-volume applications only.

---

# Core Concepts

- **sync:** Executes jobs in the current process. No serialization, no storage. For testing/development.
- **database:** Stores jobs in a SQL table. Workers poll with `SELECT ... FOR UPDATE SKIP LOCKED`.
- **redis:** Uses Redis lists + `BRPOP`. Supports atomic ops, unique jobs, rate limiting. Only driver compatible with Horizon.
- **sqs:** Amazon SQS. Fully managed, auto-scaling. Standard (unlimited) or FIFO (ordered, 300 TPS).
- **beanstalkd:** Simple protocol, tube-based queues. Minimal ecosystem support.
- **null:** Discards all pushed jobs. For disabling queues in specific environments.
- **failover:** Meta-driver wrapping multiple connections. Dispatches to secondary if primary is unreachable.

---

# When To Use

- **Redis:** Already running Redis, need Horizon, need job middleware, want minimal ops overhead.
- **SQS:** AWS-native stack, zero infrastructure management, need Lambda integration, >100K jobs/hour.
- **Database:** Redis unavailable, volume <100 jobs/hour, can't add infrastructure.
- **Failover:** Queue availability critical, two backends acceptable.

---

# When NOT To Use

- Database driver for moderate-to-high volume — the polling query becomes a contention point.
- sync driver in production — jobs execute in the HTTP request, defeating async purpose.
- SQS when Horizon is needed — Horizon only works with Redis.

---

# Best Practices

- **Separate queue Redis from cache Redis.** Cache eviction policies can delete queue keys. *Why: If the same Redis instance serves cache and queues, `allkeys-lru` eviction deletes queue keys under memory pressure — silent job loss.*
- **Set `after_commit` per connection.** Prevents jobs dispatched inside transactions from processing before the transaction commits. *Why: Without `after_commit`, a worker may read the queue before the HTTP request's DB transaction commits — the job sees uncommitted (or missing) data.*
- **Configure `retry_after` higher than the longest expected job runtime.** Prevents double-processing when a long job exceeds the timeout. *Why: If `retry_after` is 60s but a job takes 90s, the queue backend releases the job at 60s — a second worker processes it while the first is still running.*
- **Index the `jobs` table for database driver.** Index on `(queue, reserved_at)` prevents full table scans on polling queries. *Why: Without proper indexes, each poll iteration scans the entire `jobs` table — at scale, this becomes the primary bottleneck.*

---

# Performance Considerations

- Redis: ~10,000 jobs/second per instance. Memory-bound — each payload stored in memory.
- SQS: ~300 TPS per queue (default), 256KB max payload. Cost scales with volume.
- Database: each dispatch = SQL write + SQL read. At 10K jobs/hour, the `jobs` table becomes a contention point.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Database driver in production for moderate volume | Works in dev, fails under load | Polling query blocks other queries | Use Redis or SQS |
| Queue and cache sharing Redis | Convenience | Cache eviction deletes queue jobs | Separate instances |
| `QUEUE_CONNECTION=redis` not set in production | Configuration oversight | Jobs execute synchronously in HTTP request | Configure production env properly |

---

# Related Topics

- **K001 Queue Connections vs. Queues (K001)** — Topology context
- **K080 block_for Redis Option (K080)** — Worker polling optimization
- **K040 Redis Streams (K040)** — Redis alternative
