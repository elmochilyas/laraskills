# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Queue Engineering
**Knowledge Unit:** K080 — block_for Redis Option for Worker Polling
**Generated:** 2026-06-03

---

# Decision Inventory

* Blocking Poll vs Sleep Poll Strategy
* block_for Value Selection

---

# Architecture-Level Decision Trees

---

## Blocking Poll vs Sleep Poll Strategy

---

### Decision Context

Whether to use `block_for` (blocking BRPOP) or rely on polling with `--sleep` for Redis queue workers.

---

### Decision Criteria

* Queue job arrival rate
* Redis connection pool utilization
* Worker signal responsiveness
* Redis Cluster usage
* Predis vs phpredis driver

---

### Decision Tree

Using Redis Cluster?
YES → Set block_for=null — BRPOP across cluster nodes is unreliable
NO → High-throughput queue (jobs always available)?
    YES → block_for=null or 0 — no benefit from blocking
NO → Low-throughput queue (frequent idle periods)?
    YES → Using Predis driver?
        YES → block_for <= 10 (long blocks block signal handling)
        NO → block_for=5-10 — reduces Redis CPU 95%+ during idle
NO → Mixed workload?
    YES → block_for=3-5 (balance between responsiveness and idle efficiency)

---

### Rationale

Without `block_for`, idle workers execute ~20 Redis round-trips per minute at `--sleep=3`. With `block_for=5`, that drops to 12 round-trips per minute. Blocking BRPOP is event-driven in Redis — it doesn't consume Redis CPU while waiting. However, each blocking worker holds a Redis connection during the block period.

---

### Recommended Default

**Default:** `block_for=5` for Redis queues with mixed/low throughput; `block_for=null` for Redis Cluster or high-throughput queues
**Reason:** Dramatically reduces polling traffic during idle periods while maintaining sub-second responsiveness to new jobs.

---

### Risks Of Wrong Choice

- block_for with Predis >10: worker unresponsive to SIGTERM for the block duration
- block_for with Redis Cluster: BRPOP may not release when jobs arrive on other nodes
- block_for on always-busy queue: no benefit, unnecessary connection holding
- No block_for with idle queue: 1000+ extra Redis round-trips per minute at scale

---

### Related Rules

- set-block_for-for-low-volume-queues
- avoid-block-for-with-predis

---

### Related Skills

- Configure block_for to Optimize Redis Queue Polling

---

## block_for Value Selection

---

### Decision Context

Choosing the specific `block_for` timeout value for optimal trade-off between polling overhead and signal responsiveness.

---

### Decision Criteria

* Queue idle ratio
* Worker signal handling requirements
* Redis driver (phpredis vs Predis)
* Connection pool sizing

---

### Decision Tree

Queue is idle >80% of the time?
YES → block_for=10 (maximum idle efficiency)
NO → Queue is idle 50-80% of the time?
    YES → block_for=5 (balanced)
NO → Queue is rarely idle (<50%)?
    YES → block_for=0 or null (no benefit from blocking)
NO → Using Predis?
    YES → block_for <= 10 always (signal handling constraint)

---

### Rationale

Longer `block_for` values reduce polling overhead more during idle periods but hold Redis connections longer. With Predis, values >10 make workers unresponsive to SIGTERM for too long. With phpredis, values up to 10 are safe.

---

### Recommended Default

**Default:** `block_for=5` with phpredis; `block_for=3` with Predis
**Reason:** 5 seconds balances idle efficiency with connection utilization and signal responsiveness. Predis needs a lower value due to blocking I/O limitations.

---

### Risks Of Wrong Choice

- block_for >10 with Predis: worker can't process SIGTERM for 10+ seconds
- block_for=0 with idle queue: tight polling loop wastes Redis CPU
- Not sizing connection pool: blocking workers consume all available connections

---

### Related Rules

- set-block_for-for-low-volume-queues
- avoid-block-for-with-predis

---

### Related Skills

- Configure block_for to Optimize Redis Queue Polling
