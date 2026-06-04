# 10.14 Connection Health Checks - Decision Trees

## Health Check Strategy: Pooler-Level vs Application-Level

---

## Decision Context

Choosing between pooler-level health checks (PgBouncer, ProxySQL), application-level heartbeats (SELECT 1), and Octane's built-in health checks for connection validation.

---

## Decision Criteria

* performance: pooler-level checks are more efficient than per-request SELECT 1
* architectural: Octane checks health automatically; PHP-FPM doesn't need health checks
* maintainability: pooler-level checks require zero application code
* security: health check failure spikes may indicate network attacks

---

## Decision Tree

Where to implement health checks?

↓

Using a connection pooler (PgBouncer/ProxySQL)?

YES → Use pooler-level health checks (primary strategy)

    ↓
    PgBouncer: server_check_query = SELECT 1, server_check_delay = 30
    ProxySQL: mysql-monitor_connect_interval, mysql-monitor_ping_interval
    Pooler detects dead backends and removes from pool automatically
    
    ↓
    Application-level health checks are REDUNDANT
    Pooler is better positioned (network-level checks, parallel execution)

NO → Using Octane without pooler?

    YES → Rely on Octane's built-in health check
    
        ↓
    Octane validates connection health on every pool.get()
    Dead connections are automatically recreated
    No manual SELECT 1 needed
    
    ↓
    Just ensure pool config exists in database.php
    Octane handles the rest

NO → PHP-FPM without pooler?

    → No health checks needed
    PHP-FPM creates fresh connection per request
    Each connection is immediately used, then closed
    SELECT 1 before every query would double database load

---

## Recommended Default

**Default:** Pooler-level checks (primary) + Octane built-in checks (automatic)
**Reason:** Pooler-level checks are most efficient. Application-level SELECT 1 adds unnecessary load when a pooler or Octane handles it.

---

## Health Check Timeout Configuration

---

## Decision Context

Setting appropriate timeouts for health check queries to detect dead connections quickly without false positives from transient network issues.

---

## Decision Criteria

* performance: long timeouts block workers waiting for dead connections
* architectural: retry policy must distinguish transient blips from permanent failures
* maintainability: set PDO::ATTR_TIMEOUT to 2-3 seconds for health checks
* security: health check should not log credentials on failure

---

## Decision Tree

What timeout for health checks?

↓

Write connection (primary)?

YES → Aggressive timeout: 1-2 seconds, retry 2×
    
    ↓
    Primary failure is critical — detect fast
    Retry once after 100ms to confirm
    If both fail: trigger failover immediately

NO → Read connection (replica)?

    YES → Lenient timeout: 3-5 seconds, retry 1×
    
        ↓
    Replica failure is less critical — fallback to write pool
    Longer timeout avoids unnecessary failover
    Single retry to confirm

NO → Health check from monitoring tool?

    → Standard timeout: 5-10 seconds
    Monitoring checks less time-sensitive
    Avoid false alerts from aggressive timeouts

---

## Recommended Default

**Default:** Write: 2s timeout, 2 retries; Read: 3s timeout, 1 retry
**Reason:** Write failures need faster detection. Read failures have a fallback option, so aggressive detection isn't necessary.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Manage Connection Health Checks
* Configure Failover Connection Behavior
