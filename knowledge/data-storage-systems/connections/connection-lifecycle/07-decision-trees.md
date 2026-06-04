# 10.1 Connection Lifecycle - Decision Trees

## Connection Pooling Strategy: PHP-FPM vs Octane vs External Pooler

---

## Decision Context

Choosing the right connection pooling approach based on PHP runtime (PHP-FPM, Octane, Swoole) and infrastructure constraints.

---

## Decision Criteria

* performance: pooling reduces connect/disconnect overhead (50-200ms per request)
* architectural: runtime-dependent; external pooler adds ops complexity
* maintainability: Octane built-in pool is simplest; PgBouncer adds setup
* security: TLS handshake overhead on each new connection

---

## Decision Tree

Which connection pooling approach?

↓

Using Octane/Swoole?

YES → Use built-in PDO pool

    ↓
    Configure: `pool.min` and `pool.max` in database config
    
    Pros: No external service, persistent connections per worker, automatic health checks
    Cons: Connections tied to worker lifetime
    
    ```php
    'pool' => ['min' => 2, 'max' => 10],
    ```

NO → Using PHP-FPM?

    YES → Use external pooler (PgBouncer or ProxySQL)
    
        ↓
        PgBouncer for PostgreSQL:
        - Transaction mode: recommended for most apps
        - Session mode: required for prepared statements, LISTEN/NOTIFY
        - Statement mode: rare, for single-statement workloads
        
        ProxySQL for MySQL:
        - Query routing, read/write splitting
        - Connection pooling
        
        ↓
        Connection architecture:
        App → PgBouncer (port 6432) → PostgreSQL (port 5432)
        
        ↓
        Pool sizing: 50 backend connections can serve 300 PHP-FPM workers
        
        NEVER use `PDO::ATTR_PERSISTENT` — causes state leaks

NO → Single-shot CLI script?

    → No pooling needed (single connection, immediate disconnect)

---

## Recommended Default

**Default:** Octane: built-in pool; PHP-FPM: PgBouncer/ProxySQL
**Reason:** Each runtime has an optimal pooling strategy. PDO::ATTR_PERSISTENT is always wrong.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Configure Connection Pooling for PHP-FPM and Octane
