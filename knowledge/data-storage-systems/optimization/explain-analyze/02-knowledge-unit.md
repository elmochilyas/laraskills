# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.2 EXPLAIN ANALYZE (actual time, loops, actual rows)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`EXPLAIN ANALYZE` executes the query and returns actual execution metrics: actual time per node, loop count, actual rows returned, and execution time. Unlike `EXPLAIN` (estimates), `EXPLAIN ANALYZE` shows ground truth, revealing plan inaccuracies, parameterized plan issues, and time distribution.

---

# Core Concepts

- **Actual vs estimated**: `EXPLAIN` shows the planner's estimates. `EXPLAIN ANALYZE` shows what actually happened. Widely divergent actual vs estimated rows indicates stale statistics.
- **Timing per node**: Each query plan node shows actual startup time and total time. Identifies which operation is the bottleneck.
- **Loops**: Number of times a node is executed. High loops with low actual rows = nested loop problem.

---

# Patterns

**Compare actual rows to estimated**: If actual rows >> estimated rows, run `ANALYZE TABLE` to update statistics and re-check the plan.

**Find the slowest node**: Sort plan nodes by actual execution time. The node with highest total time is the bottleneck.

---

# Common Mistakes

**Running on write queries**: EXPLAIN ANALYZE actually executes INSERT/UPDATE/DELETE. Use EXPLAIN (without ANALYZE) for write queries, or run inside a transaction that rolls back.

**Not accounting for caching**: First run may be slow (buffer pool cold). Run twice and compare — the second run shows warm cache behavior.

---

# Related Knowledge Units

4.1 EXPLAIN output interpretation | 4.26 Correlation between row count and query response time
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

