# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.26 Query log analysis and identifying slow queries in production
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Production query log analysis identifies which queries consume the most database time: total time × frequency. A query taking 2ms but running 10,000 times/second is worse than a query taking 200ms running once/second. Log all queries with duration, group by query shape (normalized query), and rank by total time.

---

# Core Concepts

- **Slow query log**: MySQL/MariaDB `long_query_time`, PostgreSQL `log_min_duration_statement`. Captures queries exceeding duration threshold. First line of defense.
- **Normalized query**: `SELECT * FROM posts WHERE id = ?`. Grouping by normalized form aggregates identical queries with different parameters.
- **Total time = avg time × frequency**: The query with the highest total database time is the most impactful candidate for optimization.

---

# Patterns

**Laravel query log**: `DB::enableQueryLog()`, `DB::getQueryLog()` in middleware or telescope. Capture duration per query.

**Percona Toolkit / pt-query-digest**: Analyze MySQL slow query log, group by normalized query, output ranked by total time.

**PostgreSQL auto_explain**: Logs execution plans for slow queries. Helps identify full table scans, missing indexes.

---

# Common Mistakes

**Fixing the slowest individual query**: A 5-second query running 5x/day is less impactful than a 50ms query running 100,000x/day. Always prioritize by total time.

**Not normalizing query shapes**: `SELECT * FROM posts WHERE id = 1` and `SELECT * FROM posts WHERE id = 2` are the same query shape. Group them.

---

# Related Knowledge Units

4.5 EXPLAIN/EXPLAIN ANALYZE | 4.27 Profiling tools
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

