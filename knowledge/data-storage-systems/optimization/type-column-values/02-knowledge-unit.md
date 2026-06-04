# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.3 Type column values: system, const, eq_ref, ref, range, index, ALL
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

The `type` column in EXPLAIN is the most important indicator of query efficiency. From best to worst: `system` (0 or 1 row), `const` (unique index lookup), `eq_ref` (unique index for each row in join), `ref` (non-unique index match), `range` (indexed range scan), `index` (full index scan), `ALL` (full table scan).

---

# Core Concepts

- **const**: Primary key or unique index lookup. At most one row. Optimal.
- **eq_ref**: Each row from previous table matches exactly one row via unique index. Good for joins.
- **ref**: Non-unique index lookup. Multiple rows may match. Acceptable.
- **range**: Indexed range scan (>, <, BETWEEN, IN). Acceptable for moderate ranges.
- **index**: Full index scan (reads entire index). Better than ALL but still expensive.
- **ALL**: Full table scan. Worst. Usually requires adding an index.

---

# Mental Models

The type column is a grade: `const` = A+, `eq_ref` = A, `ref` = B, `range` = C, `index` = D, `ALL` = F. Target `ref` or better for hot queries.

---

# Patterns

**Target const or eq_ref for PK lookups**: `User::find(1)` should always be const or eq_ref. If it's not, check that the PK is indexed.

**Accept range for filtered list queries**: `WHERE created_at > ?` is a range scan. Acceptable if the date range is narrow relative to table size.

**Investigate index or ALL**: These indicate the query lacks proper index support. EXPLAIN the specific WHERE conditions and add matching indexes.

---

# Common Mistakes

**Accepting ALL on small tables**: "The table only has 1000 rows." On a table that will grow to 1M, the ALL scan becomes a problem. Add indexes preemptively based on query patterns.

**Confusing ref with eq_ref**: `ref` means multiple rows may match. If the query expects one row but gets ref, the column lacks a unique index or the query has a range condition.

---

# Related Knowledge Units

4.1 EXPLAIN output interpretation | 4.2 EXPLAIN ANALYZE
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

