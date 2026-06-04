# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.1 EXPLAIN output interpretation (type, possible_keys, key, rows, Extra, filtered)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

EXPLAIN shows how the database executes a query. Key columns: `type` (access method), `possible_keys` (candidate indexes), `key` (chosen index), `rows` (rows examined estimate), `Extra` (additional operations), `filtered` (percentage of rows kept after WHERE). Reading EXPLAIN is the primary skill for query optimization.

---

# Core Concepts

- **type (access method)**: const > eq_ref > ref > range > index > ALL. const = best (unique lookup). ALL = worst (full table scan).
- **possible_keys vs key**: possible_keys shows which indexes could be used. key shows which was chosen. If possible_keys is non-empty but key is NULL, the optimizer chose not to use any index.
- **rows**: Estimated rows the database must examine. Lower is better. Compare to actual row count to see estimation accuracy.
- **Extra flags**: "Using index" = covering index (no table access). "Using filesort" = sort not using index. "Using temporary" = temp table created. "Using where" = post-filter applied.

---

# Mental Models

EXPLAIN is the query plan debugger. It shows the database's strategy for executing the query. The goal is `type` = ref/range, low `rows`, and no "Using filesort" or "Using temporary" in `Extra`.

---

# Patterns

**Identify full table scans**: `type: ALL` with high `rows` = the query needs an index.

**Detect missing composite index**: Query filters by 3 columns. possible_keys shows 3 separate single-column indexes, but the composite index on all 3 is missing.

**Verify index choice**: The `key` column shows which index is used. If it's using a suboptimal index, consider index hints or rewriting the query.

---

# Common Mistakes

**Running EXPLAIN without ANALYZE**: EXPLAIN shows estimates, not actuals. Use `EXPLAIN ANALYZE` (PostgreSQL) or `EXPLAIN ANALYZE` (MySQL 8.0.18+) for actual execution data. For MySQL pre-8.0.18, use `EXPLAIN` for estimates and `SHOW PROFILE` for actuals.

**Ignoring filtered column**: MySQL's `filtered` shows percentage of rows kept after WHERE. Low filtered = many rows examined but few returned = missing or poorly designed index.

**Not comparing before/after**: Run EXPLAIN before and after adding an index. The type, rows, and Extra changes prove the index is effective.

---

# Related Knowledge Units

4.2 EXPLAIN ANALYZE | 4.3 Type column values | 4.4 Extra column flags
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

