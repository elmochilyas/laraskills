# 10.12 Connection Behavior in PHP-FPM vs. Octane vs. Swoole - Decision Trees

## Runtime Selection Based on Connection Architecture

---

## Decision Context

Choosing between PHP-FPM, Octane, and Swoole determines the connection pooling strategy, total connection count, and whether a server-side pooler is required.

---

## Decision Criteria

* performance: PHP-FPM pays 1-50ms per request connection overhead; Octane/Swoole amortize over many requests
* architectural: PHP-FPM must use server-side pooler; Octane uses built-in pool; Swoole uses coroutine pool
* maintainability: Octane pool is simplest; Swoole requires manual pool implementation
* security: PHP-FPM connections are ephemeral (no cross-request state); Octane/Swoole connections persist

---

## Decision Tree

Which PHP runtime for database connections?

↓

High concurrency required (>500 req/s per server)?

YES → Octane (Laravel) or Swoole native?

    → Using Laravel?
    
    YES → Octane (RoadRunner or Swoole driver)
    
        ↓
        Built-in per-worker connection pool
        Configure: pool.min, pool.max, pool.ttl
        Total connections = workers × pool.max
        Server-side pooler optional (needed for multi-server)
        
    NO → Native Swoole?
    
        → Implement coroutine-safe connection pool with Channel
        Shared pool across all coroutines — most efficient
        Requires manual pool management

NO → Using PHP-FPM?

    YES → Must deploy server-side pooler (PgBouncer/ProxySQL)
    
        ↓
        PHP-FPM creates connection per request
        Without pooler: 50 workers × 10 servers = 500 connections
        With pooler: 50-100 backend connections serve all
        
        ↓
        Acceptable for moderate traffic (<500 req/s)
        Simplest deployment model
        Each request gets fresh connection — no state leakage

NO → Mixed PHP-FPM + Octane?

    → Use PgBouncer for both
    Normalizes connection behavior across runtimes
    Octane pool is redundant but harmless

---

## Recommended Default

**Default:** Octane with built-in pool for new apps; PHP-FPM + PgBouncer for existing apps
**Reason:** Octane eliminates per-request connection overhead and doesn't require external pooler infrastructure for small deployments.

---

## Pooling Strategy Per Runtime

---

## Decision Context

Matching the connection pooling configuration to the PHP runtime to avoid connection exhaustion or wasted resources.

---

## Decision Criteria

* performance: PHP-FPM needs multiplexing; Octane needs per-worker pool sizing
* architectural: each runtime has different total connection formulas
* maintainability: Octane config is simple; Swoole requires custom code
* security: Octane/Swoole persistent connections need state cleanup between requests

---

## Decision Tree

How to configure pooling for your runtime?

↓

PHP-FPM?

YES → Server-side pooler (PgBouncer/ProxySQL)

    ↓
    Config: PgBouncer default_pool_size = 50
    Total backend connections = pool_size (not worker count)
    No pool config in Laravel database.php
    
    ↓
    PgBouncer transaction mode: 5-10× multiplexing
    PDO::ATTR_EMULATE_PREPARES = true

NO → Octane (RoadRunner or Swoole driver)?

    YES → Built-in per-worker pool
    
        ↓
        Config in database.php:
        pool.min = baseline connections per worker
        pool.max = peak connections per worker
        Total = workers × pool.max
        
        ↓
        Default: min=2, max=10
        Read pool: larger (min=4, max=12)
        Write pool: smaller (min=2, max=4)
        
        ↓
        External pooler optional — add only for multi-server scaling

NO → Native Swoole?

    → Implement ConnectionPool with Swoole\Coroutine\Channel
    Shared pool size = total connections (not per-worker)
    Most efficient — coroutines share connections
    
    ↓
    PDO is NOT coroutine-safe
    Always use Channel-based pool
    Manual health check implementation needed

---

## Recommended Default

**Default:** PHP-FPM → server-side pooler; Octane → built-in pool; Swoole → Channel-based pool
**Reason:** Each runtime has one correct pooling architecture. Using the wrong one causes connection exhaustion or unnecessary infrastructure.

---

## Related Rules

* Rule 10-2-1: Deploy Server-Side Pooler for PHP-FPM
* Rule 10-2-2: Configure Octane Connection Pool

---

## Related Skills

* Configure Pool Architecture
* Manage Connection Count
