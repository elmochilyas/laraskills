# 7-14 Octane Connection Pooling - Decision Trees

## Octane Connection Pool vs External Pooler

---

## Decision Context

Choosing between Octane's built-in `PDOConnectionPool` and external poolers (ProxySQL, PgBouncer) for managing read replica connections in Laravel Octane applications.

---

## Decision Criteria

* performance: Octane pool eliminates per-request connect/disconnect; external pooler adds network hop
* architectural: Octane pool is per-worker; external pooler is shared across workers
* maintainability: Octane pool is code-configured; external pooler adds infrastructure

---

## Decision Tree

Using Laravel Octane?

YES → Use Octane's PDOConnectionPool

    ↓
    Configure in config/database.php:
    'pool' => ['min' => 2, 'max' => 10, 'ttl' => 60]
    
    ↓
    Pro: Zero external infrastructure
    Pro: Connections persist across Octane requests
    Pro: Per-connection pool sizing
    
    ↓
    Con: Each worker has its own pool (not shared)
    Con: Octane restart required for pool config changes

NO → Using PHP-FPM?

    YES → Use external pooler (ProxySQL/PgBouncer)
        
        ↓
        PHP-FPM workers can't share connections
        Need ProxySQL (MySQL) or PgBouncer (PostgreSQL)
        
        ↓
        Pool size: 50 backend connections for 200 workers
        Transaction pooling for maximum efficiency

NO → Serverless (Vapor/Lambda)?

    → Use RDS Proxy or Aurora Data API
    Managed pooling service
    No worker management needed
    Auto-scales with invocations

---

## Recommended Default

**Default:** Octane PDOConnectionPool for Octane apps; ProxySQL/PgBouncer for PHP-FPM; RDS Proxy for serverless
**Reason:** Each runtime has a clear best-fit pooling approach. Octane's built-in pool is zero-infrastructure and well-integrated.

---

## Octane Pool Sizing

---

## Decision Context

Determining the optimal `min` and `max` values for Octane's PDOConnectionPool per connection — balancing availability against replica connection limits.

---

## Decision Criteria

* performance: `min` should match average concurrency; `max` handles bursts
* architectural: total connections = workers × pool_max × replicas
* maintainability: pool too small = queuing; too large = connection exhaustion

---

## Decision Tree

Pool sizing calculation:

↓

Step 1: Determine average concurrency per worker

↓

Average concurrent requests per worker?

↓

Low (1-2 concurrent requests)?

YES → min=1, max=4

    ↓
    Each worker rarely has >1 active query
    Min 1 connection sufficient
    Max 4 for brief bursts

NO → Moderate (3-5 concurrent requests)?

    YES → min=3, max=8
        
        ↓
        Each worker handles 3-5 queries concurrently
        Min 3 matches average
        Max 8 handles peaks

NO → High (6-10 concurrent requests)?

    → min=6, max=15
    Heavy concurrent workload per worker
    Verify: workers × max × replicas < replica max_connections

---

## Recommended Default

**Default:** min=2, max=5 for average Octane workers (4-8 concurrent requests per worker)
**Reason:** min=2 covers average concurrency. max=5 handles 2.5x bursts. Adjust based on monitoring.

---

## Related Rules

* Rule 7-14-1: Always Configure Pool for Octane Replica Connections
* Rule 7-14-2: Ensure Workers × Pool Max ≤ Replica max_connections

---

## Related Skills

* Configure Octane Connection Pool for Read Replicas
* Size Octane Connection Pool for Read Replicas
