# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.28 Database-specific execution plan analysis (EXPLAIN output interpretation)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

EXPLAIN output differs significantly between MySQL/MariaDB and PostgreSQL. MySQL shows join type, key, rows examined, and Extra. PostgreSQL shows node type, startup cost, total cost, rows, width, and actual timing with ANALYZE. Understanding both is essential for cross-platform optimization.

---

# Core Concepts

- **MySQL EXPLAIN columns**: `select_type`, `table`, `type` (const/ref/range/index/ALL), `possible_keys`, `key`, `ref`, `rows`, `Extra` (Using index, Using where, Using filesort, Using temporary).
- **PostgreSQL EXPLAIN**: `Seq Scan` vs `Index Scan` vs `Index Only Scan`, `cost=startup..total`, estimated rows, `width`. With `ANALYZE`, shows actual rows and timing.
- **Red flags in MySQL**: `type=ALL` (full table scan), `Extra=Using filesort` (no sort index), `Extra=Using temporary` (temp table for GROUP BY), `rows >> actual` (bad cardinality estimate).
- **Red flags in PostgreSQL**: `Seq Scan` on large table, `Sort Method: external merge Disk` (sort exceeds work_mem), large row count mismatch between estimate and actual.

---

# Patterns

**MySQL single-column index check**: `EXPLAIN SELECT * FROM orders WHERE user_id = 1`. Check `type=ref` and `key` uses the index. If `type=ALL`, index is missing.

**PostgreSQL actual vs estimated**: `EXPLAIN (ANALYZE, BUFFERS) SELECT ...`. Large discrepancy indicates stale statistics. Run `ANALYZE`.

---

# Common Mistakes

**EXPLAIN without ANALYZE on PostgreSQL**: Shows only estimates (costs, rows). Not useful for identifying actual performance issues. Always use `EXPLAIN (ANALYZE, BUFFERS)`.

**Ignoring filter selectivity**: `rows` in MySQL EXPLAIN shows estimated examined rows. If estimated rows is 1M but actual is 10, the optimizer may choose a bad plan. Update statistics.

---

# Related Knowledge Units

4.5 EXPLAIN/EXPLAIN ANALYZE | 3.10 Index types
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

