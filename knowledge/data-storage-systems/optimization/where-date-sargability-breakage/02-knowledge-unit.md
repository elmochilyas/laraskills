# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.8 whereDate/whereMonth/whereYear/whereDay/whereTime sargability breakage
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's `whereDate`, `whereMonth`, `whereYear`, `whereDay`, and `whereTime` methods wrap columns in functions, breaking index usage. `Post::whereDate('created_at', today())` generates `WHERE DATE(created_at) = ?`. Fix by using half-open range comparisons: `whereBetween('created_at', [$start, $end])`.

---

# Core Concepts

- **Generated SQL**: `whereDate('col', $d)` → `DATE(col) = ?`. `whereMonth('col', 1)` → `MONTH(col) = 1`.
- **Index bypass**: The function wrap prevents B-Tree index usage on `col`.
- **Fix**: `where('created_at', '>=', $date->startOfDay())->where('created_at', '<', $date->startOfNextDay())`.

---

# Mental Models

Every time you use `whereDate`, you're asking the database to compute a function for every row. This is a full table scan in disguise.

---

# Patterns

**Carbon range**: `$start = $date->startOfDay(); $end = (clone $date)->addDay()->startOfDay(); whereBetween('created_at', [$start, $end])`.

**Microsecond-safety**: `startOfNextDay()` instead of `endOfDay()` to catch rows with microsecond timestamps right at midnight.

---

# Common Mistakes

**whereDate inside a scope**: A local scope that calls `whereDate` silently breaks index on every invocation. Always use range queries in scopes.

**Using whereDate for JOIN conditions**: `join('posts', fn($j) => $j->whereDate(...))` — double index bypass on the joined table.

---

# Related Knowledge Units

3.28 Sargability rule | 4.7 Sargable vs non-sargable
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

