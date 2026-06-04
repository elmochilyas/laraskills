# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.30 Performance budget enforcement in CI (query count, duration thresholds)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Performance budgets in CI prevent query count and duration regressions before deployment. Enforce N+1 detection, total query count per request, and slow query thresholds. Use PHPUnit assertions, custom test macros, or GitHub Actions with performance benchmarks. Catch regressions before they reach production.

---

# Core Concepts

- **Query count assertion**: `Http::fake()` + `DB::enableQueryLog()` in tests. Assert that an endpoint fires exactly N queries.
- **Duration threshold**: `$response->getDuration()` or `Clockwork::getQueries()->sum('duration')` — fail tests exceeding max duration.
- **N+1 detection**: `Model::preventLazyLoading()` in tests. Every lazy load throws an exception, failing the test.

---

# Patterns

**Test with DB::enableQueryLog**: `DB::enableQueryLog(); $response = $this->get('/posts'); $this->assertCount(5, DB::getQueryLog());`.

**PHPUnit @group slow**: Tag performance tests with `@group performance`. Run in CI as optional workflow (not blocking PR merge).

**Baseline comparison**: Store query count and duration baselines in JSON. CI compares against baselines and warns on regression.

---

# Common Mistakes

**No query count assertions in tests**: Without them, a new relationship added to a view can silently add 50+ queries. Every endpoint test should assert query count.

**False negatives from connection differences**: SQLite in tests may execute different query patterns than MySQL/PostgreSQL. Run performance tests against the production-alike database.

---

# Related Knowledge Units

4.25 Lazy loading detection | 4.26 Query log analysis
## Ecosystem Usage

Tools like Laravel Telescope, Debugbar, and Pulse provide framework-level visibility. MySQL slow query log and PostgreSQL auto_explain offer database-level profiling. RDS Performance Insights adds cloud-native monitoring.

## Failure Modes

Missing indexes cause full table scans on large tables. Implicit type conversion prevents index usage. OR conditions break composite index leftmost prefix rules. LIKE leading wildcards prevent index usage.

## Performance Considerations

EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table queries affects performance.

## Production Considerations

Enable slow query logging with 200ms thresholds for OLTP. Set up automated EXPLAIN ANALYZE for slow queries. Establish query performance budgets in CI. Profile endpoint-level query counts.

## Research Notes

MySQL 8.4+ improves optimizer statistics with histogram collection. PostgreSQL 17 enhances parallel query execution. AI-assisted optimization automates index recommendations.

## Internal Mechanics

The query optimizer evaluates multiple access paths choosing the lowest-cost plan. MySQL uses a cost-based optimizer with table statistics. PostgreSQL uses more detailed statistics including most-common-values.

## Architectural Decisions

Query cache for read-heavy low-write workloads. Materialized views for complex aggregations. Read replicas for reporting offload.

## Tradeoffs

Benefit: Fast reads via indexes. Cost: Slower writes. Benefit: Query cache hits. Cost: Cache invalidation overhead. Benefit: Read replica distribution. Cost: Replica lag.

## Mental Models

The query planner is a chess engine evaluating moves. It estimates cost of each access path. Bad statistics lead to bad plans. Statistics need regular updates via ANALYZE.

