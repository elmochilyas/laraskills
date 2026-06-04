# 10.2 Pool Architecture (Client-Side vs Server-Side) - Decision Trees

## Client-Side vs Server-Side Pool Architecture

---

## Decision Context

Choosing between client-side pooling (Octane's built-in PDO pool) and server-side pooling (PgBouncer, ProxySQL, RDS Proxy) based on runtime, traffic, and infrastructure constraints.

---

## Decision Criteria

* performance: server-side adds <1ms proxy latency; client-side has no extra hop
* architectural: runtime-dependent; server-side adds ops complexity
* maintainability: Octane built-in pool is simplest; PgBouncer/ProxySQL require setup
* security: TLS handshake overhead per new connection; poolers add another network hop

---

## Decision Tree

Which pool architecture?

↓

Using Octane/Swoole?

YES → Is app entirely on Octane (no PHP-FPM)?

    YES → Use Octane built-in client-side pool
    
        ↓
        Configure `pool.min` and `pool.max` in database config
        Total connections = workers × pool.max
        No extra infrastructure needed
        
    NO → Mixed Octane + PHP-FPM?
    
        → Use server-side pooler (PgBouncer/ProxySQL) for compatibility
        Both runtimes connect to same pooler

NO → Using PHP-FPM only?

    YES → Use server-side pool (PgBouncer for PG, ProxySQL for MySQL)
    
        ↓
        Mandatory — PHP-FPM cannot pool connections internally
        50 backend connections can serve 300 PHP-FPM workers (transaction pooling)
        Never use `PDO::ATTR_PERSISTENT` — causes state leaks
        
        ↓
        PgBouncer: lightweight, PostgreSQL only
        ProxySQL: feature-rich query routing, MySQL
        RDS Proxy: AWS-managed, serverless, IAM auth
        
    NO → Single-shot CLI script?
    
        → No pooling needed (single connection, immediate disconnect)

---

## Recommended Default

**Default:** Octane → built-in client-side pool; PHP-FPM → server-side pooler (PgBouncer/ProxySQL)
**Reason:** Each runtime has one optimal pooling strategy. Client-side for Octane avoids extra infra; server-side for PHP-FPM prevents connection exhaustion.

---

## Separate Read vs Write Pool Sizing

---

## Decision Context

Configuring asymmetric pool sizes for read replicas vs write primaries to match different workload characteristics.

---

## Decision Criteria

* performance: reads tolerate higher latency; writes need strict consistency
* architectural: read replicas handle more concurrent connections; write pools need health checks
* maintainability: separate config per connection name in database.php
* security: writes must never route to stale replicas

---

## Decision Tree

How to size read vs write pools?

↓

Separate read/write connections?

YES → Is read traffic > 5× write traffic?

    YES → Read pool: 3-5× larger than write pool
    
        ↓
        Read pool: default_pool_size = 100-200 (PgBouncer)
        Write pool: default_pool_size = 30-50
        Monitors pool utilization separately per pool
        
    NO → Read pool: 2× write pool
    
        ↓
        Read pool: default_pool_size = 60-100
        Write pool: default_pool_size = 30-50

NO → Single shared pool for both?

    → Use write-optimized sizing (smaller pool)
    Configure health checks for write pool
    Read queries share the same pool — may contend under load

---

## Recommended Default

**Default:** Asymmetric pools — read: 3-5× larger than write
**Reason:** Read replicas handle more connections and tolerate more queuing; write pools must stay responsive for consistency.

---

## Related Rules

* Rule 10-2-1: Deploy Server-Side Pooler for PHP-FPM
* Rule 10-2-2: Configure Octane Connection Pool
* Rule 10-2-4: Consider Architecture Guidelines

---

## Related Skills

* Configure Pool Architecture (Client-Side vs Server-Side)
* Manage Connection Count
* Configure Read/Write Connection Separation
