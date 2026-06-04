# 10.4 Laravel Octane Connection Pool Configuration - Decision Trees

## Octane Pool Sizing: min vs max per Worker

---

## Decision Context

Configuring Octane's per-worker connection pool — setting `pool.min` (pre-warmed connections) and `pool.max` (upper limit) — to balance connection availability against database capacity.

---

## Decision Criteria

* performance: pool hit ~0.01ms; pool miss ~1-50ms; without pool, every request pays connection overhead
* architectural: total DB connections = workers × pool.max; must respect database max_connections
* maintainability: separate pool configs needed for read vs write connections
* security: each pooled connection holds credentials in worker memory

---

## Decision Tree

How to size Octane connection pool per worker?

↓

Worker typically handles how many concurrent requests?

↓

Baseline < 4 concurrent requests?

YES → pool.min = 2, pool.max = 6

    ↓
    2 pre-warmed connections handle normal traffic
    4 additional available for spikes
    Total for 8 workers: 8 × 6 = 48 connections

NO → Baseline 4-8 concurrent requests?

    YES → pool.min = 4, pool.max = 10
    
        ↓
        4 pre-warmed for baseline
        6 additional for spikes
        Total for 8 workers: 8 × 10 = 80 connections
        
        ↓
        Verify: 80 < database max_connections - reserved

NO → Baseline > 8 concurrent requests?

    → Reconsider worker count (too few workers?)
    Or increase workers instead of pool.max
    
    ↓
    If worker count is fixed: pool.min = baseline, pool.max = baseline × 1.5
    Monitor: if pool wait times > 10ms, increase pool.max

---

## Recommended Default

**Default:** `pool.min = 2, pool.max = 10` per worker with separate read/write configs
**Reason:** Covers most workloads while keeping total connections manageable. Read pool larger, write pool smaller.

---

## Octane Pool with Read/Write Separation

---

## Decision Context

Configuring asymmetric Octane pool sizes for read replicas vs write primaries based on different concurrency patterns.

---

## Decision Criteria

* performance: reads dominate traffic (typically 80%+); writes need low latency
* architectural: read pool larger, write pool smaller
* maintainability: separate pool config under read/write connection keys
* security: writes must never use stale replica connections

---

## Decision Tree

Separate read/write pool configs?

↓

Read traffic > 5× write traffic?

YES → Read pool: min=4, max=12; Write pool: min=2, max=4

    ↓
    Reads: more concurrent, tolerance for queuing
    Writes: fewer concurrent, need immediate execution
    Total for 8 workers: reads 96 + writes 32 = 128 connections
    
    Verify: 128 < database max_connections

NO → Read traffic 2-5× write traffic?

    YES → Read pool: min=3, max=8; Write pool: min=2, max=4
    
        ↓
        More balanced sizing
        Total for 8 workers: reads 64 + writes 32 = 96 connections

NO → Single pool for both?

    → Use write-optimized sizing (min=2, max=6)
    Reads compete with writes for pool connections
    Consider separating connections if read queries show wait times

---

## Recommended Default

**Default:** Read pool `min=4, max=12`; Write pool `min=2, max=4`
**Reason:** Read and write workloads have fundamentally different concurrency profiles. Asymmetric pools prevent write starvation while allowing read throughput.

---

## Related Rules

* Rule 10-2-2: Configure Octane Connection Pool
* Rule 10-2-4: Consider Architecture Guidelines
* Rule 10-2-1: Deploy Server-Side Pooler for PHP-FPM

---

## Related Skills

* Configure Pool Architecture
* Manage Connection Count
