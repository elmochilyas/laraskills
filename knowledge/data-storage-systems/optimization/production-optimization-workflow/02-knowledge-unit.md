# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.30 Production optimization workflow: profile -> identify -> measure -> fix -> verify -> monitor
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

## Executive Summary

Systematic query optimization follows a closed-loop workflow: **Profile** the production workload, **Identify** the bottleneck queries, **Measure** their impact and baseline, **Fix** the root cause (index, query rewrite, schema change), **Verify** the improvement via A/B comparison, and **Monitor** for regression. Skipping any step produces guesswork optimization — fixing the wrong query, optimizing a 2ms query while a 2s query is ignored, or deploying a fix without verifying it works under production load.

---

## Core Concepts

- **Profile**: Collect raw performance data from production — slow query log, pg_stat_statements, performance_schema, APM traces.
- **Identify**: Rank queries by total impact (frequency × average duration). Fix the queries that cost the most aggregate database time, not the single slowest query.
- **Measure**: Establish baseline metrics (p50/p95/p99 duration, rows examined, call frequency) before making changes.
- **Fix**: Apply the appropriate optimization — index addition, query rewrite, eager loading fix, schema change.
- **Verify**: Compare post-fix metrics against baseline. Confirm improvement under production-like concurrency, not just single-user dev.
- **Monitor**: Track the fix over time to detect regression from data growth or query pattern changes.

```
Total Query Cost = Frequency × Average Duration

Query A: 10ms × 1,000,000/day = 10,000,000 ms/day (10,000s)
Query B: 2,000ms × 100/day = 200,000 ms/day (200s)

Fix Query A first — it costs 50x more total database time.
```

---

## Mental Models

The workflow is like a doctor's diagnostic process: you don't prescribe medication based on a symptom list (slow app). You run tests (profile), interpret results (identify), establish baselines (measure vital signs), treat (fix), re-test (verify), and schedule follow-ups (monitor). Treating without diagnosis is guessing. Optimizing without baselines is guessing. Deploying without verification is guessing.

---

## Internal Mechanics

**Slow query log capture** (MySQL):
```sql
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 0.2;  -- 200ms threshold
SET GLOBAL log_queries_not_using_indexes = ON;
```

**pg_stat_statements** (PostgreSQL): Installed as an extension, it tracks normalized query statistics since the last reset.
```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Rank queries by total execution time
SELECT queryid,
       LEFT(query, 100) AS query_preview,
       calls,
       ROUND(total_exec_time::numeric, 2) AS total_ms,
       ROUND(mean_exec_time::numeric, 2) AS mean_ms,
       ROUND((total_exec_time / SUM(total_exec_time) OVER()) * 100, 2) AS pct_of_total
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
ORDER BY total_exec_time DESC
LIMIT 20;
```

**Performance schema** (MySQL 5.6+ / MariaDB 10+):
```sql
-- Top queries by total wait time
SELECT DIGEST_TEXT,
       COUNT_STAR,
       SUM_TIMER_WAIT / 1000000000 AS total_seconds,
       AVG_TIMER_WAIT / 1000000000 AS avg_seconds
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;
```

**Laravel Telemetry**: Collect per-endpoint query metrics via DB::listen and structured logging.
```php
// In AppServiceProvider::boot()
DB::listen(function (QueryExecuted $query) {
    if ($query->time > 100) { // Queries slower than 100ms
        Log::channel('slow-queries')->warning('Slow query detected', [
            'sql' => $query->sql,
            'bindings' => $query->bindings,
            'time' => $query->time,
            'url' => request()?->fullUrl(),
            'method' => request()?->method(),
        ]);
    }
});
```

---

## Patterns

**Triage by total cost**: Most optimization value comes from fixing the top 5 queries by total execution time. Ignore queries with low total cost, even if individual instances are slow.

```
Rank | Query Shape              | Frequency | Avg Time | Total/Day | Action
1    | SELECT * FROM orders ... | 500,000   | 45ms     | 22,500s   | Add covering index
2    | SELECT FROM users ...    | 1,000,000 | 8ms      | 8,000s    | Already good, skip
3    | INSERT INTO logs ...     | 200,000   | 30ms     | 6,000s    | Batch inserts
4    | Dashboard report         | 50        | 60,000ms | 3,000s    | Materialized view
```

**EXPLAIN before and after**: For every query you optimize, capture the EXPLAIN plan before and after. Store these in a query plan repository for regression comparison.

```bash
# Capture plan before
EXPLAIN ANALYZE FORMAT=JSON SELECT * FROM orders WHERE status = 'pending' \G > plans/4.30/before.json

# Apply fix (e.g., create index)
php artisan migrate

# Capture plan after
EXPLAIN ANALYZE FORMAT=JSON SELECT * FROM orders WHERE status = 'pending' \G > plans/4.30/after.json

# Compare: look for changes in type, rows, Extra, Actual Time
```

**A/B verification in production**: Use a canary deployment to route 5% of traffic to the fix while 95% stays on the old code. Compare p95 response times between the two groups.

```php
// Feature flag-driven query path
$useOptimizedQuery = Feature::forUser($user)->active('optimized-orders-query');

if ($useOptimizedQuery) {
    // New: covering index on (status, created_at, id)
    $orders = Order::where('status', 'pending')
        ->orderBy('created_at')
        ->select('id', 'status', 'created_at')
        ->get();
} else {
    // Old: full table scan
    $orders = Order::where('status', 'pending')
        ->orderBy('created_at')
        ->get();
}
```

**Profile -> Fix loop timebox**: Spend 80% of optimization time on profiling and measurement, 20% on the fix. Most optimization value comes from understanding the problem clearly, not writing clever SQL.

---

## Architectural Decisions

| Phase | Tool | When |
|-------|------|------|
| Profile | pg_stat_statements / performance_schema | PostgreSQL / MySQL production |
| Profile | Laravel Pulse / Telescope | Development and staging |
| Identify | pt-query-digest / mysqldumpslow | Analyzing slow query log dumps |
| Measure | Custom structured logging + metrics dashboard | When tracking improvement over time |
| Fix | Migration for index/schema change | Most common query fix |
| Verify | EXPLAIN ANALYZE plan comparison | Always before deploying |
| Monitor | Alert on p95/p99 increase per query shape | Continuous production monitoring |

---

## Tradeoffs

| Benefit | Cost |
|---------|------|
| Systematic workflow prevents wasted effort | Takes discipline to follow every step |
| Total-cost prioritization maximizes ROI | Single-user slow queries get deprioritized (even if perceived as critical) |
| EXPLAIN plan repository enables regression detection | Requires process for storing and comparing plans |
| A/B verification confirms real-world improvement | Feature flag complexity, longer deployment cycle |

---

## Performance Considerations

- Profiling adds overhead. pg_stat_statements has negligible overhead (~2-5% on most workloads). MySQL performance_schema adds more overhead (10-15%) — enable it on replicas or during specific profiling windows.
- Slow query log at 200ms threshold captures problematic queries without filling disk. Adjust up to 500ms for high-throughput OLTP systems.
- pt-query-digest aggregates slow queries by fingerprint (normalized query shape). Use it to find the most expensive query patterns.
- Storing EXPLAIN plans: `FORMAT=JSON` (MySQL) stores plans in a parseable format. PostgreSQL's `auto_explain` module can log plans automatically.

---

## Production Considerations

- **Never optimize in production without baselines**. Create a performance dashboard (Grafana + Prometheus, Datadog, or Laravel Pulse) that shows p50/p95/p99 response time per endpoint before making changes.
- **Document every optimization**: Why was this query slow? What was the fix? What was the improvement? This prevents future developers from reverting the fix or trying the same optimization again.
- **Optimizating for p50 vs p99**: Index additions improve p50 (most queries are fast). Query rewrites improve p99 (eliminate outliers). Fix both.
- **Schedule optimization windows**: Dedicate one sprint per quarter to query optimization. Unplanned optimization (fixing queries as they break) is more expensive than systematic optimization.

---

## Common Mistakes

**Optimizing the wrong query**: A query running 100ms at 100 req/s costs 10s/s. A query running 5000ms at 1 req/s costs 5s/s. The 100ms query is the bigger problem. Always calculate total cost first.

**No baseline before fix**: Without a baseline, you can't prove the fix worked. A query that "feels faster" might be the same speed or even slower under production concurrency.

**Optimizing in development only**: A query running 2ms on a dev database with 10k rows performs differently on production with 10M rows. Always test fixes on production-sized data.

**Skipping verification**: Adding an index without verifying that the query plan changed is guessing. Always run EXPLAIN before and after.

```sql
-- Before: full table scan (type: ALL)
EXPLAIN SELECT * FROM orders WHERE status = 'pending';       -- type: ALL, rows: 1,000,000

-- After adding index: ref access
EXPLAIN SELECT * FROM orders WHERE status = 'pending';       -- type: ref, rows: 50,000
```

---

## Failure Modes

- **Worsened performance from wrong index**: Adding a composite index with column ordering that doesn't match query patterns adds write overhead without read benefit. Always test with the actual query.
- **Query plan regression**: A fix that works today may regress as data grows. An index that supports 10k rows efficiently may not support 10M rows if additional filtering predicates change.
- **Optimization fatigue**: Teams that skip the workflow and "fix" queries arbitrarily burn time without measurable improvement. This erodes confidence in the optimization process.
- **Over-optimization**: Spending 4 hours optimizing a query that runs once per week for 2 seconds. The opportunity cost of not optimizing the 100ms query that runs 100,000 times daily is significant.

---

## Ecosystem Usage

Laravel Pulse provides production monitoring for slow queries and query counts per endpoint. Laravel Telescope offers detailed query profiling during development. Percona Monitoring and Management (PMM) provides MySQL-specific query analytics. pgAdmin and pg_stat_monitor offer PostgreSQL query profiling. APM tools (Datadog, Scout APM, New Relic) unify application and database profiling in one dashboard.

---

## Related Knowledge Units

4.1 EXPLAIN output interpretation | 4.5 MySQL slow query log | 4.6 PostgreSQL slow query configuration | 4.27 Profiling tools | 4.28 Endpoint query governance

---

## Research Notes

The workflow described here (profile -> identify -> measure -> fix -> verify -> monitor) is adapted from Google's SRE practices for database performance, formalized in the "Site Reliability Engineering" book and refined in the "Database Reliability Engineering" literature. The key innovation in the Laravel ecosystem is the tight feedback loop between ORM-generated queries and database profiling — enabling developers to optimize at the correct abstraction layer rather than dropping to raw SQL as a first resort.
