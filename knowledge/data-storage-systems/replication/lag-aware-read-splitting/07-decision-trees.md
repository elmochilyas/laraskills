# 7-7 Lag Aware Read Splitting - Decision Trees

## Per-Query vs Cached Lag Check

---

## Decision Context

Choosing between checking replica lag on every query (most accurate but adds overhead) vs checking at intervals and caching the value.

---

## Decision Criteria

* performance: per-query lag check adds SHOW REPLICA STATUS overhead on every request
* architectural: cached lag may be slightly stale but avoids per-query overhead
* maintainability: cached approach is simpler; per-query is precise

---

## Decision Tree

Read query volume?

↓

High (> 1000 reads/second)?

YES → Cache lag value, check at intervals

    ↓
    Check SHOW REPLICA STATUS every 1-5 seconds
    Store lag in Redis/memory with TTL
    
    ↓
    Query processor reads cached lag value (sub-millisecond)
    Accept: up to 5s stale lag data (fine for lag-aware routing)
    
    ↓
    Pro: negligible per-query overhead
    Con: lag data up to 5s old

NO → Low (< 100 reads/second) or write-heavy?

    YES → Check lag on each read request (or per-request)
        
        ↓
        Check lag once at request start
        Or check per sensitive query
        
        ↓
        Overhead: one SHOW REPLICA STATUS per request
        Acceptable for low-volume apps

NO → Mixed sensitivity?

    → Cache for sensitive: check cached lag (fast path)
    No check for tolerant: always route to replicas
    Different routing per query class

---

## Recommended Default

**Default:** Cache lag with 1-5s TTL; check cached value on each request for sensitive queries
**Reason:** Cached lag avoids per-query monitoring overhead while providing lag data fresh enough for routing decisions.

---

## Query Classification for Lag Sensitivity

---

## Decision Context

Tagging read queries as lag-sensitive (must be fresh) vs lag-tolerant (can be stale) to enable intelligent read-splitting.

---

## Decision Criteria

* performance: sensitive queries may route to primary when lag is high
* architectural: classification determines read source during lag
* maintainability: misclassification leads to stale data or unnecessary primary load

---

## Decision Tree

Query reads data that the user just wrote?

YES → Lag-sensitive — route to primary if lag > 1s

    ↓
    User profile after edit
    Order confirmation after submit
    Dashboard after form submission
    
    ↓
    Must reflect user's own writes immediately
    Use sticky writes or lag-aware routing

NO → Query reads reference data (products, categories)?

    YES → Sensitivity depends on freshness requirement
        
        ↓
        Immediate (user sees product changes)? → Sensitive (< 2s lag)
        Eventually consistent? → Tolerant
        
    NO → Query is for analytics/reporting/aggregation?
    
        YES → Lag-tolerant — always route to replica
            
            ↓
            Reports, dashboards, data exports
            Minutes-old data is acceptable
            Never route to primary
            
        NO → Cache-hit queries?
        
            → Tolerant (cache doesn't need to be real-time)
            Cached data from replicas is acceptable
            Replica lag only matters for cache-miss → refill from primary

---

## Recommended Default

**Default:** User data reads = sensitive; reference/cached data = tolerant; analytics = always replica
**Reason:** Reads of user-written data must be fresh. Everything else can tolerate some lag. Default sensitive queries to primary when lag exceeds 2s.

---

## Related Rules

* Rule 7-5-1: Always Monitor Replica Lag
* Rule 7-7-1: Classify Queries by Sensitivity

---

## Related Skills

* Implement Lag-Aware Read Splitting
* Classify Queries for Lag Sensitivity
