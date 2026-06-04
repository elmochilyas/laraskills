# 7-2 Laravel Read Write Config - Decision Trees

## Laravel Config vs Proxy-Level Splitting

---

## Decision Context

Choosing between Laravel's built-in read/write host configuration in `config/database.php` and proxy-level routing (ProxySQL, PgBouncer, RDS Proxy).

---

## Decision Criteria

* performance: Laravel config is application-level; proxy handles routing transparently
* architectural: Laravel config is simple and framework-native; proxy is infrastructure-level
* maintainability: Laravel config requires no external infra; proxy adds ops complexity

---

## Decision Tree

Using Laravel with simple replication (1 primary, 1-2 replicas)?

YES → Laravel read/write config

    ```php
    'mysql' => [
        'read' => ['host' => ['replica1', 'replica2']],
        'write' => ['host' => ['primary']],
        'sticky' => true,
    ],
    ```

    ↓
    Simple, no extra infrastructure
    Laravel handles routing automatically

NO → Need advanced routing (read-after-write, weighted, health checks)?

    YES → Proxy-level routing (ProxySQL, PgBouncer, RDS Proxy)
        
        ↓
        ProxySQL: query rules, read/write splitting, multiplexing
        PgBouncer: transaction pooling, connection reuse
        RDS Proxy: AWS-managed, IAM auth, connection pooling
        
        ↓
        Application connects to proxy always
        Proxy handles read/write routing transparently

NO → Single database node?

    → No splitting needed
    Single connection config
    No read/write config required

---

## Recommended Default

**Default:** Laravel read/write config for simple replication; proxy-level for complex routing needs
**Reason:** Laravel config is zero-infrastructure. Proxies add ops overhead but enable sophisticated routing, pooling, and health checking.

---

## Sticky Writes Configuration

---

## Decision Context

Enabling or disabling the `sticky` option in Laravel's database config — controlling whether reads after a write use the primary connection within the same request.

---

## Decision Criteria

* performance: sticky writes send some reads to primary (reduces replica utilization)
* architectural: sticky prevents read-after-write inconsistencies
* maintainability: enabled by default in Laravel — no code changes needed

---

## Decision Tree

Users should always see their own writes immediately?

YES → Enable sticky writes (default)

    ↓
    'sticky' => true
    
    ↓
    After any write, subsequent reads use primary
    Prevents: user creates post, redirects to list, post not visible (replica lag)
    
    ↓
    Tradeoff: some reads hit primary instead of replicas
    Acceptable: only after writes, which is minority of requests

NO → Read-after-write consistency not required?

    YES → Disable sticky writes
        
        ↓
        'sticky' => false
        
        ↓
        Pure read/write splitting at all times
        Even after writing, reads use replicas
        
        ↓
        Risk: stale reads after write
        Acceptable for: analytics, reporting, read-only dashboards

NO → Replication lag is zero (sync replication)?

    → Sticky writes not needed
    All replicas have the same data
    Reads always consistent

---

## Recommended Default

**Default:** `'sticky' => true` for user-facing applications; `false` for analytics/reporting
**Reason:** Sticky writes prevent the most common consistency issue (read-after-write). The performance cost is negligible for most applications.

---

## Related Rules

* Rule 7-2-1: Always Enable Sticky Writes
* Rule 7-2-2: Never Route Writes To Read Hosts

---

## Related Skills

* Configure Laravel Read/Write Connections
* Implement Automatic Query Routing
