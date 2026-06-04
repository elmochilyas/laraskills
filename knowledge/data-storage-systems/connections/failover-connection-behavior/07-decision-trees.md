# 10.16 Connection Failover Behavior - Decision Trees

## Failover Strategy: Proxy vs DNS vs Application-Level

---

## Decision Context

Choosing the primary failover strategy — proxy-based, DNS-based, or application-level — to minimize recovery time when the primary database fails.

---

## Decision Criteria

* performance: proxy failover 1-10s; DNS failover 30-300s; app-level failover 1-5s
* architectural: proxy failover is most transparent (no app code changes)
* maintainability: proxy failover requires extra infrastructure
* security: failover must handle credential changes for new primary

---

## Decision Tree

Which failover strategy?

↓

Proxy already deployed (ProxySQL, RDS Proxy)?

YES → Use proxy-level failover as PRIMARY strategy

    ↓
    Proxy detects backend failure via health checks
    Routes new queries to promoted replica automatically
    Existing connections: transparently moved (or reconnected)
    
    ↓
    Recovery time: 1-10s (detection + promotion)
    No application code changes needed
    Implement app-level retry as fallback

NO → Proxy available but not deployed?

    → Deploy proxy for failover — highest ROI infrastructure investment
    Single proxy eliminates need for complex app-level failover code

NO → Cannot deploy proxy (constraints)?

    YES → Application-level failover with retry
    
        ↓
    App detects connection failure → reads new primary host
    config()->set() new host → DB::purge() → DB::reconnect() → retry
    Exponential backoff: 100ms, 200ms, 400ms
    
    ↓
    Recovery time: 1-5s (detection + failover)
    Requires: ConfigService to provide new primary hostname
    Requires: retry logic wrapped around database queries

NO → Simple architecture, tolerant of downtime?

    → DNS failover
    Update DNS record for DB_HOST
    Reduce TTL to 30-60s
    App reconnects on DNS TTL expiry
    
    ↓
    Recovery time: 30-300s (TTL-dependent)
    Simplest — no proxy, no code changes
    Acceptable only for low-availability requirements

---

## Recommended Default

**Default:** Proxy-level failover as primary + application-level retry as fallback
**Reason:** Proxy failover is transparent and fast. Application-level retry provides a safety net if the proxy itself fails.

---

## Retry Strategy: When to Retry After Failover

---

## Decision Context

Implementing query retry logic that distinguishes connection failures (retryable) from query errors (non-retryable) and uses appropriate backoff.

---

## Decision Criteria

* performance: retry adds latency; 3 retries with backoff = ~2.6s
* architectural: must only retry connection errors, not query logic errors
* maintainability: wrap retry logic in a reusable function or macro
* security: log all failover events for audit trail

---

## Decision Tree

Database query failed — should we retry?

↓

Error indicates connection failure?

YES → Error message contains: 'lost connection', 'gone away', 'could not connect', 'connection refused'?

    YES → Connection error — RETRYABLE
        
        ↓
        First retry: 100ms delay
        Second retry: 200ms delay
        Third retry: 400ms delay
        
        ↓
        On each retry: purge stale connection → reconnect → retry query
        Max retries: 3 (beyond this, fail fast)
        
    NO → Non-connection error (SQL syntax, constraint violation)?
    
        → NOT retryable — throw immediately
        Retrying SQL logic errors wastes time and may multiply damage

NO → Timeout error?

    → NOT retryable (query may have executed on DB)
    Retry could cause duplicate writes
    Handle idempotency at application level

---

## Recommended Default

**Default:** 3 retries with exponential backoff (100ms, 200ms, 400ms), only for connection errors
**Reason:** Connection-only retry prevents duplicate write hazards. Exponential backoff gives the database time to recover without overwhelming it.

---

## Related Rules

* Rule 10-6-1: Always Pair Config Change with Purge
* Rule 5: Consider architecture guidelines

---

## Related Skills

* Manage Failover Connection Behavior
* Manage Connection Purging and Reconnection
