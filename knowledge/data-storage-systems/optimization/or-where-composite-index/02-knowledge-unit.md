# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.11 orWhere on composite index without grouping
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`orWhere` on a composite index can cause a full table scan because the OR condition references a different part of the index. MySQL often decides a full scan is cheaper than merging two index scans. Group OR conditions explicitly or use UNION instead.

---

# Core Concepts

- **Problem**: `WHERE user_id = ? OR status = 'urgent'` — the composite index on `(user_id, status)` covers the first condition but not the second without `user_id`. MySQL scans the table.
- **Fix 1 — Group ORs**: `where(fn($q) => $q->where('user_id', X)->orWhere('status', 'urgent'))` — tells MySQL the OR scope is limited.
- **Fix 2 — UNION**: Two separate queries, each using its own index. UNION merges results.

---

# Patterns

**Always group orWhere**: Use closure-based grouping to clarify OR scope. Prevents unexpected full table scans.

**UNION for high-selectivity OR**: When each branch of the OR is highly selective, UNION is faster than a single OR query.

---

# Common Mistakes

**Unintentional OR scope**: `where('a', 1)->orWhere('b', 2)` — the OR applies to the ENTIRE WHERE clause. Often the developer intended `where('a', 1)` AND `(x OR y)` but wrote `(where a) OR (b)`.

---

# Related Knowledge Units

2.14 Unions | 4.24 Join optimization
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

