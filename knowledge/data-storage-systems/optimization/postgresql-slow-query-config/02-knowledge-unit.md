# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.6 PostgreSQL slow query configuration (log_min_duration_statement, auto_explain)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

PostgreSQL's `log_min_duration_statement` logs queries exceeding a duration threshold. The `auto_explain` extension logs EXPLAIN plans for slow queries, enabling post-hoc analysis without reproducing the slow query.

---

# Core Concepts

- **log_min_duration_statement**: Set to 500 (ms). Logs SQL text and duration. `0` logs all queries.
- **auto_explain**: Extension that logs EXPLAIN plans for queries above a threshold. `auto_explain.log_min_duration = 500`.
- **pg_stat_statements**: Tracks execution statistics per normalized query. Total time, mean time, calls, rows, block hits/reads.

---

# Patterns

**Use auto_explain for plan capture**: When a query is slow at 3am, auto_explain captures the plan so you can analyze it the next morning.

**pg_stat_statements for top-N analysis**: Identify the most time-consuming queries overall, not just slow individual queries.

---

# Common Mistakes

**Not installing auto_explain**: Without it, you have the slow query text but no plan. Reproducing the exact plan later is difficult.

---

# Related Knowledge Units

4.5 MySQL Slow Query Log | 4.30 Production optimization workflow
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

