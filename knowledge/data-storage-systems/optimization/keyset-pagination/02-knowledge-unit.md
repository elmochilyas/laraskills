# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.18 Keyset pagination (efficient for large datasets, stable sort required)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Keyset pagination (also called "seek pagination") is similar to cursor pagination but uses composite keys to paginate through sorted result sets with non-unique sort columns. It requires a stable sort order and a tiebreaker column (typically the primary key).

---

# Core Concepts

- **Multi-column cursor**: `WHERE (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 20` — supports sorting by non-unique columns.
- **Tiebreaker**: The second column (usually PK) ensures stability when multiple rows share the same sort value.
- **No OFFSET**: Like cursor pagination, performance is constant per page.

---

# Patterns

**Sort by created_at with id tiebreaker**: `WHERE (created_at, id) < ($lastCreatedAt, $lastId) ORDER BY created_at DESC, id DESC LIMIT 20`.

**Sort by category + created_at**: `WHERE (category_id, created_at, id) > ($cat, $date, $id) ORDER BY category_id, created_at, id LIMIT 20`.

---

# Common Mistakes

**No tiebreaker column**: Sorting by `created_at` alone — if 10 rows have the same timestamp, pagination misses or duplicates rows.

---

# Related Knowledge Units

4.16 Offset pagination | 4.17 Cursor pagination
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

