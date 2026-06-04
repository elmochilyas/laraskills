# 7-8 Connection Pooling Replicas - Decision Trees

## PHP-FPM vs Octane Pooling Strategy

---

## Decision Context

Choosing between server-side poolers (ProxySQL/PgBouncer) for PHP-FPM and Laravel Octane's built-in PDO connection pool for managing replica connections.

---

## Decision Criteria

* performance: PHP-FPM can't share connections between workers — needs external pooler
* architectural: Octane workers maintain persistent connections — built-in pool is sufficient
* maintainability: external pooler adds infrastructure; Octane pool is code-based

---

## Decision Tree

Using PHP-FPM?

YES → External pooler required (ProxySQL or PgBouncer)

    ↓
    Problem: 200 FPM workers × 3 replicas = 600 connections
    Each replica max_connections = 150
    Solution: pooler reduces to 150 shared connections
    
    ↓
    ProxySQL (MySQL): read/write splitting, query rules, health checks
    PgBouncer (PostgreSQL): lightweight, transaction pooling

NO → Using Laravel Octane?

    YES → Octane's PDOConnectionPool
            
        ↓
        config:
        pool: min=2, max=10, ttl=60
        
        ↓
        Each Octane worker maintains its own pool
        Connections persist across requests (no connect/disconnect overhead)
        Pool size = concurrent queries per worker
        
        ↓
        Pro: no external infrastructure
        Pro: zero connection churn
        Con: each worker still has its own connections

NO → Serverless (Vapor, Lambda)?

    → Optimize for short-lived connections
    Use RDS Proxy / Aurora Data API
    Minimize connection count per invocation
    Connection pooling handled by cloud service

---

## Recommended Default

**Default:** ProxySQL/PgBouncer for PHP-FPM; Octane's PDOConnectionPool for Octane; RDS Proxy for serverless
**Reason:** PHP-FPM needs external pooling because workers don't share connections. Octane's built-in pool is sufficient. Serverless needs managed pooling to avoid connection exhaustion.

---

## Transaction vs Session Pooling

---

## Decision Context

Choosing between transaction pooling (connection returned to pool after transaction ends) and session pooling (connection held for the entire PHP process/PgBouncer session).

---

## Decision Criteria

* performance: transaction pooling is 10-100x more efficient
* architectural: session pooling required for SET SESSION, prepared statements, LISTEN/NOTIFY
* maintainability: transaction pooling is simpler and more performant

---

## Decision Tree

Application uses session-level SQL features?

YES → Session pooling

    ↓
    Features requiring session pooling:
    - SET SESSION ... (timezone, role, search_path)
    - PREPARE / EXECUTE (real prepared statements)
    - LISTEN / NOTIFY
    - Temporary tables
    
    ↓
    PgBouncer: session pooling mode
    Each worker holds a dedicated backend connection
    Less efficient but required for these features

NO → Standard web app (SELECT, INSERT, UPDATE, DELETE)?

    YES → Transaction pooling (recommended)
        
        ↓
        PgBouncer: transaction pooling mode
        Connection returned to pool after each transaction
        10-100x more connections served per backend
        
        ↓
        Note: prepared statements need ATTR_EMULATE_PREPARES
        Laravel: PDO::ATTR_EMULATE_PREPARES = true

NO → Statement pooling?

    → Rarely beneficial
    Connection returned after each statement
    Fragile — most queries benefit from transaction scope

---

## Recommended Default

**Default:** Transaction pooling for most web applications; session pooling only if SET/PREPARE/LISTEN features are required
**Reason:** Transaction pooling is much more efficient. Modern ORMs (including Laravel) work well with transaction pooling and emulated prepared statements.

---

## Related Rules

* Rule 7-8-1: Always Size Connection Pool for Peak Concurrency
* Rule 7-8-2: Never Exceed Replica max_connections

---

## Related Skills

* Configure Connection Pooling for Read Replicas
* Select Pooling Mode for Application Workload
