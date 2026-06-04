## Prioritize by total query cost (execution_time × call_count), not per-query duration
---
Category: Diagnostics
---
Sort captured SQL queries by total cost (average duration × call count) descending and optimize the top 3-5 queries — never optimize based on per-query duration alone.
---
Reason: A single 200ms query costs 200ms. A 5ms query called 200 times (N+1) costs 1000ms — 5x more. Per-query duration optimization prioritizes the wrong target. Total cost captures the actual impact on request time. N+1 queries are invisible in MySQL's slow query log (each query is fast individually) but dominate profiling reports. Sorting by total cost surfaces them as top priority, where single-query analysis would miss them entirely.
---
Bad Example:
```text
# Sorted by duration — misses N+1
# Query A: 200ms × 1 = 200ms — "optimize this"
# Query B: 5ms × 200 = 1000ms — "fast, ignore"
```

Good Example:
```text
# Sorted by total cost
# Query B: 5ms × 200 = 1000ms — OPTIMIZE FIRST (N+1)
# Query A: 200ms × 1 = 200ms — optimize second
```
---
Exceptions: Queries with very high duration (>1000ms even once) should be optimized immediately regardless of total cost ranking.
---
Consequences Of Violation: N+1 queries left unoptimized because each individual query appears fast, massive total cost wasted on repeated executions.

## Cross-reference profiling SQL data with MySQL slow query log for complete coverage
---
Category: Diagnostics
```
Compare the list of slow queries identified by profiling tools against the MySQL slow query log — each tool catches issues the other misses, and together they provide complete coverage.
---
Reason: Profiling tools capture all queries executed during the profiled request but have limited sample coverage (only profiled requests). The MySQL slow query log captures all queries that exceed the threshold, 24/7, but misses fast individual queries that are expensive in aggregate (N+1). Cross-referencing ensures no slow query category is missed — profiling catches N+1 patterns, slow query log catches all chronically slow queries regardless of profiling coverage.
---
Bad Example:
```bash
# Only one source — incomplete picture
# Profiling: no slow queries found (sampled 10% of traffic)
# MySQL slow log: several 500ms queries (missed by profiling sampling)
```

Good Example:
```bash
# Both sources cross-referenced
# Profiling: N+1 pattern detected (5ms × 200 calls)
# MySQL slow log: full table scan detected (800ms)
# Both prioritized and fixed
```
---
Exceptions: Applications with profiling coverage on 100% of traffic may not need the MySQL slow log for query identification.
---
Consequences Of Violation: Missed slow queries — either N+1 patterns (invisible to slow log) or occasional slow queries (missed by profiling sampling).

## Check the call stack for each flagged slow query — same query may be acceptable in one context but catastrophic in another
---
Category: Diagnostics
```
For each slow query identified by total cost, review its call stack to understand the calling context — a query may be acceptable in an offline report but catastrophic in an online API endpoint.
---
Reason: The same query fingerprint (e.g., SELECT * FROM orders WHERE user_id = ?) may execute in different contexts with different expectations. In an admin report endpoint, 2 seconds may be acceptable. In a user-facing API endpoint, 200ms is too slow. Optimizing the query for the slow context might add complexity that the fast context doesn't need. The call stack reveals which context drives the optimization priority and what constraints apply.
---
Bad Example:
```text
# Query optimized for the wrong context
# "SELECT * FROM orders WHERE user_id = ?" totals 5000ms
# Added complex index — but 90% of calls are in the report endpoint
# Report still runs at 2s (limited by data volume, not index)
```

Good Example:
```text
# Context-aware optimization
# 90% of cost: admin report (acceptable at 2s) — skip optimization
# 10% of cost: API endpoint (200ms should be 20ms) — optimize for this
```
---
Exceptions: Queries with exceptionally high total cost (>10 seconds in any context) should be optimized regardless of context.
---
Consequences Of Violation: Over-indexing or over-optimizing queries that are already acceptable in their primary context, wasted DBA effort on non-bottlenecks.

## Check row count alongside execution time — high row count often indicates missing LIMIT or unnecessary joins
---
Category: Diagnostics
```
Review the average row count returned by each flagged query alongside its execution time — a query returning 10,000 rows with 50ms duration is likely returning too much data, even if the execution time seems acceptable.
---
Reason: Execution time alone doesn't tell the full story. A query that returns 10,000 rows but takes only 50ms is still problematic — the data transfer time, serialization cost, and memory allocation for those 10,000 rows significantly increase total request time beyond the query's 50ms. High row count with moderate duration often indicates missing LIMIT clauses, forgotten pagination, or unnecessary JOINs that pull in more data than needed.
---
Bad Example:
```text
# Duration-only analysis — misses data volume issue
# Query: 50ms — fast enough, skip optimization
# But returns 10,000 rows — serialization adds 500ms elsewhere
```

Good Example:
```text
# Row count + duration analysis
# Query: 50ms, 10,000 rows — data volume is the bottleneck
# Added LIMIT 50 — query now 5ms, serialization 25ms
# Total saving: 520ms
```
---
Exceptions: Export or reporting queries that legitimately return large datasets may accept high row counts.
---
Consequences Of Violation: Query execution time optimized while data volume remains excessive, total request time still dominated by serialization and data transfer costs.

## Profile before and after query optimization with the same tool to validate impact
---
Category: Testing
```
Run a profile, apply query optimization, and re-profile using the same profiler at the same sample rate — compare total cost for the optimized query to confirm the fix worked.
---
Reason: Without before/after profiling, the impact of a query optimization is unknown — the query might be faster but the overall request might not improve if the bottleneck shifted elsewhere. Profiling before and after with the same methodology ensures the optimization had the intended effect and no new bottlenecks were introduced. The comparison reveals whether total query cost decreased, whether the reduction translated to faster request time, and whether any other code path became the new bottleneck.
---
Bad Example:
```bash
# Optimization applied without validation
# "Query was taking 200ms, now it's 50ms" — but request time unchanged
# Bottleneck shifted to serialization — optimization provided no user benefit
```

Good Example:
```bash
# Before and after profiling
# Before: Query 200ms, request 250ms
# After: Query 50ms, request 100ms — 60% improvement confirmed
```
---
Exceptions: Trivial optimizations (adding a missing index) with predictable impact may skip re-profiling, but validation is still recommended.
---
Consequences Of Violation: Optimization effort wasted on queries that aren't the real bottleneck, false sense of improvement when total request time is unchanged.
