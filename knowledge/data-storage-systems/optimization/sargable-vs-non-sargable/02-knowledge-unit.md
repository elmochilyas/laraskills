# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.7 Sargable vs. non-sargable query patterns
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Sargable conditions allow index usage. Non-sargable conditions force full table scans. The rule: the indexed column must appear alone (no function wrapping) on one side of the comparison operator. Non-sargable patterns are the leading cause of unexpected full table scans in Laravel applications.

---

# Core Concepts

- **Sargable**: `WHERE col = ?`, `WHERE col > ?`, `WHERE col IN (?)`, `WHERE col LIKE 'prefix%'`.
- **Non-sargable**: `WHERE LOWER(col) = ?`, `WHERE DATE(col) = ?`, `WHERE CAST(col AS CHAR) = ?`, `WHERE col LIKE '%suffix'`.

---

# Patterns

**Replace function wrap with range**: `WHERE YEAR(created_at) = 2026` → `WHERE created_at >= '2026-01-01' AND created_at < '2027-01-01'`.

**Use case-insensitive collation**: `WHERE LOWER(email) = 'test@test.com'` → set column collation to case-insensitive, use `WHERE email = 'test@test.com'`.

---

# Common Mistakes

**whereDate/whereMonth/whereYear**: Eloquent's date helper methods wrap columns in functions. Always use range queries.

**OrderBy with function**: `orderByRaw('LOWER(name)')` — causes filesort. Use functional index or case-insensitive collation.

---

# Related Knowledge Units

3.28 Sargability rule | 4.8 whereDate sargability | 4.9 LIKE leading wildcard | 4.10 Function wraps
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

