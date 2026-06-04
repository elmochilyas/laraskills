# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.29 Database statistics, cardinality estimates and optimizer decisions
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The query optimizer relies on table statistics (row count, cardinality, data distribution) to choose execution plans. Stale or inaccurate statistics cause poor plan selection: full table scans when an index would be faster, nested loops when hash join is better. Regular `ANALYZE` (MySQL) or `ANALYZE` (PostgreSQL) keeps statistics fresh.

---

# Core Concepts

- **Cardinality**: Number of distinct values in a column. High cardinality (e.g., id) makes range scans efficient. Low cardinality (e.g., status) may not benefit from an index.
- **Histograms**: PostgreSQL and MySQL 8.0 create histograms for non-uniform data distributions. Enables better estimates for range predicates.
- **ANALYZE vs optimize**: ANALYZE updates statistics only. OPTIMIZE TABLE rebuilds the table + updates stats. ANALYZE is sufficient for most optimizer issues.

---

# Patterns

**After bulk data changes**: Run `ANALYZE TABLE` (MySQL) or `ANALYZE` (PostgreSQL) after bulk inserts, deletes, or updates. Prevents stale stats.

**Auto-analyze tuning**: PostgreSQL auto-analyze triggers after `autovacuum_analyze_threshold` + `autovacuum_analyze_scale_factor × rows` changes. For frequently updated tables, lower the threshold.

**MySQL auto-recompute**: MySQL automatically recalculates statistics when >10% of rows change. Manual analyze still useful for edge cases.

---

# Common Mistakes

**Assuming ANALYZE is unnecessary**: "My query was fast yesterday, slow today" — statistics may have changed. Run ANALYZE.

**Skipping ANALYZE after import**: Freshly imported tables have default statistics. Run ANALYZE immediately. Without it, the optimizer may produce poor plans.

---

# Related Knowledge Units

3.9 Query optimizer internals | 4.28 EXPLAIN output interpretation
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

