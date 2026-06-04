# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.19 chunk vs chunkById vs cursor vs lazy vs lazyById tradeoffs
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Each iteration method has different memory profiles and stability characteristics: `chunk` (offset-based, unstable), `chunkById` (key-based, stable), `cursor` (single query, stream, holds connection), `lazy` (LazyCollection, holds connection), `lazyById` (LazyCollection + key-based, holds connection). Choose based on data stability, connection duration tolerance, and memory constraints.

---

# Core Concepts

- **chunk**: Uses OFFSET internally. Rows can be skipped/duplicated if modified between chunks.
- **chunkById**: Uses `WHERE id > ? ORDER BY id LIMIT ?`. Stable — no skipped/duplicated rows.
- **cursor**: Single query, PHP generator, yields one row at a time. Low memory, holds connection.
- **lazy**: LazyCollection wrapping cursor. Supports collection methods (map, filter).
- **lazyById**: LazyCollection with key-based ordering.

---

# Patterns

**chunkById for production backfills**: Stable ordering. Safe for tables with concurrent modifications.

**cursor for memory-safe exports**: Process millions of rows for CSV/JSON generation.

**lazy for collection pipelines**: Chain map/filter/reduce on large results without loading all into memory.

---

# Common Mistakes

**chunk on tables with modifications**: Rows shift due to OFFSET. Use chunkById.

**cursor in long-running queue jobs**: Holds connection for entire iteration. Use chunkById for queued processing.

---

# Related Knowledge Units

2.23 chunk/chunkById/cursor/lazy | 4.20 Memory optimization
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

