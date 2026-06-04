# 6-7 Fan Out Queries - Decision Trees

## Parallel vs Sequential Fan-Out

---

## Decision Context

Choosing between parallel fan-out (query all shards concurrently) and sequential fan-out (query shards one at a time) — balancing latency and connection usage.

---

## Decision Criteria

* performance: parallel latency = max(shard_latency); sequential latency = sum(shard_latency)
* architectural: parallel uses N connections at once; sequential uses 1 connection at a time
* maintainability: parallel is more complex (concurrency management); sequential is trivial

---

## Decision Tree

Latency requirement for fan-out query:

↓

Sub-second response needed?

YES → Must use parallel fan-out

    ↓
    Latency = max(shard_latency), not sum(shard_latency)
    
    ↓
    4 shards × 100ms each:
    - Parallel: 100ms ✓
    - Sequential: 400ms ✗
    
    ↓
    Implementation options:
    - Swoole/Octane coroutines (go() + defer())
    - parallel PHP extension
    - Async MySQL client
    
    ↓
    Risk: N simultaneous connections per fan-out query

NO → Seconds-to-minutes response acceptable (reports, admin)?

    ↓
    Can the application use sequential execution?
    
    YES → Sequential fan-out (for non-time-critical queries)
        
        ↓
        Query shard 1, wait, query shard 2, wait...
        Connect to one shard at a time
        
        ↓
        Pro: Simple to implement (foreach loop)
        Pro: Uses one connection at a time
        Pro: No concurrency management needed
        
        ↓
        Con: Latency = N × avg(shard_latency)
        Con: Unacceptable for user-facing queries

NO → Latency-sensitive but sequential too slow

    → Parallel fan-out with connection pool
    Must ensure pool doesn't exhaust connections
    Use Octane for coroutine-based fan-out

---

## Recommended Default

**Default:** Parallel fan-out for user-facing queries; sequential for background/admin reports
**Reason:** User-facing queries need max latency = slowest shard. Background queries can tolerate serial execution and benefit from simpler code.

---

## Timeout and Partial Failure Strategy

---

## Decision Context

Determining timeout per shard for fan-out queries and whether to accept partial results or fail the entire query when one shard is slow or unresponsive.

---

## Decision Criteria

* performance: no timeout = slow shard blocks entire query indefinitely
* architectural: partial results may be acceptable for some queries; others need complete data
* maintainability: per-shard timeout is more complex but more robust

---

## Decision Tree

Does the query need complete data from all shards?

YES → Complete results required

    ↓
    Per-shard timeout = expected P99 latency × 3
    
    ↓
    If any shard times out:
    → Fail the entire query
    → Return error to caller
    → Log which shard failed
    
    ↓
    Use case: financial reports, data exports
    Partial data could cause incorrect decisions

NO → Partial results are acceptable?

    YES → Per-shard timeout with graceful degradation
        
        ↓
        Per-shard timeout = expected P99 latency × 2
        
        ↓
        If a shard times out:
        → Log warning with shard ID
        → Include partial results with caveat
        → Mark response as "partial"
        
        ↓
        Use case: search results, dashboards, admin lists
        Missing a few results is better than no results

NO → Need all results but occasional timeouts acceptable?

    → Retry strategy
    First attempt: timeout = P99 × 2
    If timeout: retry once with timeout = P99 × 3
    If retry fails: fail entire query

Timeout value determination:

↓

Known P99 latency per shard?

YES → timeout = P99 × 2 (allow for spikes)

NO → Use 2 seconds as default timeout

    Monitor: if frequent timeouts, increase to 5s
    If high timeout tolerance, set based on SLA

---

## Recommended Default

**Default:** Per-shard timeout = 2x P99 latency; partial results acceptable for user-facing queries; complete results for financial/export
**Reason:** Timeouts prevent one slow shard from blocking everything. Partial results are better than errors for most user-facing scenarios.

---

## Related Rules

* Rule 6-7-1: Always Use Parallel Execution For Fan-Out
* Rule 6-7-2: Never Allow Fan-Out Without Timeout

---

## Related Skills

* Implement Fan-Out Queries Across Shards
* Build a Fan-Out Query Executor
