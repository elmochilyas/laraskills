# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.5 MySQL Slow Query Log configuration and analysis (mysqldumpslow, pt-query-digest)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

The MySQL Slow Query Log records queries exceeding a time threshold. Combined with `mysqldumpslow` (aggregation) and `pt-query-digest` (detailed analysis), it provides the definitive production dataset for identifying optimization targets.

---

# Core Concepts

- **Configuration**: `slow_query_log = 1`, `long_query_time = 0.5` (seconds), `log_queries_not_using_indexes = 1`.
- **mysqldumpslow**: Summarizes slow log by query pattern. `-s t` sorts by total time, `-t 10` shows top 10.
- **pt-query-digest**: Percona's comprehensive analyzer. Groups queries by fingerprint, shows histogram, query times, index usage.

---

# Patterns

**Start with long_query_time = 0.5**: Capture moderately slow queries without overwhelming the log with sub-millisecond queries.

**Use pt-query-digest weekly**: Generate a report of the top 10 slowest queries by total execution time. Focus optimization efforts there.

**Log queries not using indexes**: This catches missing index issues even on fast queries.

---

# Common Mistakes

**long_query_time too high**: Setting to 5 seconds captures only the worst offenders. Misses the 200ms queries that run 1000 times/second.

**analyzing slow log without aggregation**: Reading individual entries is overwhelming. Always use pt-query-digest for aggregated analysis.

---

# Related Knowledge Units

4.6 PostgreSQL slow query config | 4.30 Production optimization workflow
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

