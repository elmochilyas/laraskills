# Standardized Knowledge: Slow Query Identification Through Profiling Tool SQL Analysis

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Profiling & Observability |
| Knowledge Unit | Slow Query Identification Through Profiling Tool SQL Analysis |
| Difficulty | Intermediate |
| Lifecycle | Diagnose, Optimize |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Dependencies | Sargable vs non sargable, Composite index column ordering |

## Overview

Profiling tools capture actual SQL queries with their execution time, parameter values, and stack traces. This reveals which queries are slow, where they're called from, and how many times they execute. The combination of query time + call count reveals the real cost: a 5ms query called 200 times (N+1) costs 1000ms — far more than a single 200ms query.

## Core Concepts

- **SQL capture**: Blackfire and Tideways automatically capture database queries with duration, row count, and parameter values. Xdebug requires explicit PDO/mysqli tracing extension.
- **Query cost analysis**: Total query cost = sum(execution_time × call_count) for each unique query. Grouped by query fingerprint (normalized query text without parameters).
- **N+1 detection**: Same query fingerprint with different parameters, executed many times from the same stack trace. Blackfire highlights N+1 queries automatically in the dashboard.
- **Slow query log cross-reference**: Compare profiling tool's slow queries with MySQL's slow query log. Not all slow queries appear in the log (threshold-based) but all are visible in profiles.

## When To Use

- Investigating endpoint latency where database time is suspected as the bottleneck
- Detecting N+1 query patterns invisible to database slow query logs
- Prioritizing query optimizations by total cost (not just per-query duration)
- Correlating slow queries with specific code paths and call stacks
- Validating query optimization impact before/after deployment

## When NOT To Use

- When only database-level profiling is needed (use MySQL slow query log directly)
- When the profiling tool does not capture query parameters (some sampling profilers miss SQL)
- For query-by-query micro-optimization without understanding the calling context — always check where the query is called from

## Best Practices

- **Always check total cost, not per-query time**: A 5ms query called 200 times = 1000ms. Prioritize by total cost = execution_time × call_count.
- **Cross-reference with MySQL slow query log**: Profiling tools see all queries. Slow query log sees only queries over threshold. Use both for complete picture.
- **Prioritize N+1 queries first**: They are invisible in slow query logs (each query is fast individually) but have the highest total cost. Fix N+1 with eager loading.
- **Group by query fingerprint**: Normalize query text (remove parameters) to identify the same query pattern across different requests. This reveals the most expensive query patterns overall.
- **Look at the stack trace, not just the SQL**: A slow query might be acceptable in one context but catastrophic in another. The call stack tells you where it's called from.

## Architecture Guidelines

- **Query capture pipeline**: PDO/mysqli layer → profiler hook → capture query text, params, duration, stack trace → aggregate by fingerprint → display in profiling dashboard
- **Fingerprinting**: Normalize SQL by replacing parameters with placeholders (`SELECT * FROM users WHERE id = ?`). Group by fingerprint for cost analysis.
- **Integration with APM**: Tideways and Blackfire show slow queries alongside the transaction trace — click from a slow endpoint directly to its SQL queries.

## Performance Considerations

- SQL capture overhead: <1% for sampling profilers (Tideways, SPX) that capture query metadata only for sampled requests
- Blackfire SQL instrumentation: 10-25% overhead (instrumented, not sampling) — staging only
- Query fingerprinting: CPU cost is negligible — done in post-processing, not at runtime
- Data volume: Each profile may contain hundreds of queries — storage scales with traffic and sample rate

## Security

- SQL query parameters may contain sensitive data (user IDs, emails, PII) — ensure profiling tool masks or excludes parameter values in dashboards
- Tideways and Blackfire support parameter redaction — configure this before production profiling
- Never expose raw query logs containing parameter values on public dashboards
- Database credentials should never appear in captured SQL (use parameterized queries)
- Query fingerprints (without parameters) are safe to share and store

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Fixing slow queries without profiling | Relying only on MySQL slow query log | Missing N+1 queries that are fast individually but expensive in aggregate | Always profile to see the full query cost picture |
| Optimizing the wrong query | Looking only at per-query duration | Reducing 200ms query by 50% saves 100ms, while 100×5ms N+1 could save 500ms | Prioritize by total cost (execution_time × call_count) |
| Not checking the call stack | Assuming all slow queries are the same | Optimizing a query that's only slow in one context when it's fine everywhere else | Check stack trace to understand the calling context |
| Ignoring row count | Focusing only on execution time | Missing queries that return thousands of rows unnecessarily | Check both duration and row count; high row count often indicates missing LIMIT |

## Anti-Patterns

- **Index-only optimization**: Adding indexes fixes many slow queries but doesn't fix N+1 patterns. Always profile to distinguish between slow queries and too-many-queries.
- **Single-query analysis**: Optimizing a query without checking if it's called in a loop. A 2ms query called 1000 times = 2000ms. Eager loading or batching may be more effective than query optimization.
- **Profiling without query context**: Looking at flame graphs without correlating to SQL queries. A wide I/O frame (blue) might be database, Redis, or HTTP — always drill into SQL queries to confirm.

## Examples

```bash
# Blackfire: SQL analysis in dashboard
# 1. Open profile for slow endpoint
# 2. Navigate to "SQL" tab
# 3. Sort by "Total Time" descending
# 4. Look for: same fingerprint, many calls, different parameters → N+1
# 5. Click to see call stack for each occurrence

# Tideways: SQL tracepoints
# Configure tracepoints to capture SQL in TIDEWAYS_TRACEPOINTS env
# View SQL queries per transaction in dashboard

# Expected output interpretation:
# Fingerprint                           Calls  Total    Avg     Row Count
# SELECT * FROM users WHERE id = ?      200    1000ms   5ms     1
# SELECT * FROM orders WHERE status=?   1      200ms    200ms   5000
# UPDATE sessions SET data=? WHERE id=? 50     25ms     0.5ms   0

# Priority:
# 1. N+1: SELECT users WHERE id=? (200 calls, 1000ms total) — eager load
# 2. Large scan: SELECT orders (200ms, 5000 rows) — add index + LIMIT
```

## Related Topics

- Inclusive vs Exclusive Time Analysis
- Callgraph Analysis Techniques
- Database Query Benchmarking Integration
- N+1 Detection and Prevention
- Production Guardrails and Profiling Cost

## AI Agent Notes

- Total query cost = execution_time × call_count — always prioritize by this metric
- N+1 queries are invisible in MySQL slow query log but dominate profiling reports
- Cross-reference profiling SQL data with MySQL slow query log for complete picture
- Check stack trace to understand calling context — same query may be slow in one path but fine in another
- Row count is as important as duration — high row count often indicates missing LIMIT or unnecessary joins

## Verification

- [ ] Profiling tool configured to capture SQL queries (Tideways/Blackfire tracepoints)
- [ ] Profile generated for the slow endpoint under investigation
- [ ] Queries sorted by total cost (execution_time × call_count) descending
- [ ] N+1 patterns identified (same fingerprint, many calls, different parameters)
- [ ] Top 3 queries by total cost identified for optimization
- [ ] Call stack reviewed for each flagged query to understand calling context
- [ ] MySQL slow query log cross-referenced with profiling data
- [ ] Optimization applied (eager loading, index, query rewrite) and verified with new profile
