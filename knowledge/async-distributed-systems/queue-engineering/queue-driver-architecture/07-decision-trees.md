# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K002 — Queue Driver Architecture
**Generated:** 2026-06-03

---

# Decision Inventory

* Queue Driver Selection Strategy
* Redis Queue vs Cache Isolation
* retry_after Configuration Timing

---

# Architecture-Level Decision Trees

---

## Queue Driver Selection Strategy

---

### Decision Context

Choosing the right queue driver (Redis, SQS, database, sync) for a given workload. The driver determines throughput, durability, operational complexity, and ecosystem compatibility (Horizon, monitoring).

---

### Decision Criteria

* Throughput requirements (jobs/hour)
* Horizon/monitoring requirements
* Existing infrastructure (AWS, Redis)
* Operational team capabilities
* Payload size constraints

---

### Decision Tree

Horizon required?
YES → Redis (only compatible driver)
NO → AWS-native stack with zero-infrastructure preference?
    YES → SQS
    NO → Volume <100 jobs/hour?
        YES → Database driver acceptable
        NO → Volume 100-10K jobs/hour?
            YES → Redis (best balance)
            NO → Volume >10K jobs/hour?
                YES → Redis (10K/sec) or SQS (unlimited standard)
                NO → Evaluate further

---

### Rationale

Redis is the production default — high throughput, Horizon support, job middleware, minimal ops overhead if Redis already used for cache. SQS suits AWS-native serverless architectures. Database is a fallback for low-volume only. Sync is for development/testing only.

---

### Recommended Default

**Default:** Redis with dedicated Redis instance
**Reason:** Highest throughput, full Horizon support, all job middleware features, minimal operational complexity for teams already running Redis.

---

### Risks Of Wrong Choice

- Database at moderate volume: polling query becomes contention point
- SQS when Horizon needed: Horizon only works with Redis
- Sync in production: jobs execute in HTTP request, defeating async purpose
- Queue+cache sharing Redis: cache eviction deletes queue jobs silently

---

### Related Rules

- separate-queue-redis-from-cache
- set-after-commit-per-connection
- retry-after-exceeds-longest-job
- no-database-driver-for-production-volume

---

### Related Skills

- Select and Configure the Right Queue Driver
- Configure Queue Connections vs Queues

---

## Redis Queue vs Cache Isolation

---

### Decision Context

Whether to use a shared Redis instance for both queues and cache or separate instances. Impacts data durability, memory management, and operational complexity.

---

### Decision Criteria

* Memory pressure and eviction policy on shared Redis
* Job loss tolerance
* Infrastructure budget and operational overhead
* Application volume (jobs/hour)

---

### Decision Tree

Low volume (<100 jobs/hour) or development environment?
YES → Shared Redis instance acceptable
NO → Queue persistence (RDB/AOF) required?
    YES → Separate instance (persistence config differs from cache)
    NO → Cache eviction policy is volatile (allkeys-lru, allkeys-lfu)?
        YES → Separate instances required
        NO → Transaction volume high?
            YES → Separate instances (performance isolation)
            NO → Monitor and separate if memory pressure occurs

---

### Rationale

Cache eviction policies (especially `allkeys-lru`) delete queue keys under memory pressure — silent job loss with no trace. Separate instances prevent this entirely. The cost of an additional Redis instance is negligible compared to the risk of silent data loss.

---

### Recommended Default

**Default:** Separate Redis instances for queue and cache
**Reason:** Eliminates the primary source of silent job loss (cache eviction deleting queue keys). Acceptable exceptions: development or <100 jobs/hour.

---

### Risks Of Wrong Choice

- Shared instance under memory pressure: allkeys-lru eviction deletes job payloads silently
- Different operational requirements (persistence for queue, cache-only for cache) conflict on shared instance

---

### Related Rules

- separate-queue-redis-from-cache

---

### Related Skills

- Select and Configure the Right Queue Driver

---

## retry_after Configuration Timing

---

### Decision Context

Setting the `retry_after` value for queue connections. Determines how long the queue backend waits before releasing a reserved job for reprocessing. Interacts with SQS visibility timeout.

---

### Decision Criteria

* Maximum expected job runtime (p99)
* Driver type (Redis vs SQS)
* Double-processing tolerance
* Job idempotency capability

---

### Decision Tree

Driver is SQS?
YES → Set retry_after 5-10s LESS than SQS visibility timeout
NO → Driver is Redis?
    YES → Set retry_after to 2x the longest expected job runtime
NO → Driver is database?
    YES → Set retry_after to max job runtime + buffer

---

### Rationale

For Redis, `retry_after` is the sole timeout — set it to 2x the longest job's expected runtime. For SQS, `retry_after` must be shorter than the SQS visibility timeout; otherwise SQS releases the message before Laravel considers the job failed, causing double processing.

---

### Recommended Default

**Default:** `retry_after = 90` for Redis, `retry_after = visibility_timeout - 10` for SQS
**Reason:** Balances safety margin against job completion. 90s covers most jobs; adjust upward for known long-running jobs.

---

### Risks Of Wrong Choice

- Too low: worker killed mid-job, job released to another worker — double processing
- Too high: failed jobs wait too long before retry — delays recovery
- SQS retry_after > visibility timeout: guaranteed double processing

---

### Related Rules

- retry-after-exceeds-longest-job
- set-after-commit-per-connection

---

### Related Skills

- Select and Configure the Right Queue Driver
