# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.21 Query shape discipline: list views vs. detail views
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

List views (index, search results) and detail views (show page) have fundamentally different data requirements. List views need minimal columns and few relationships. Detail views need full data and deeper relationships. Both should be explicitly defined and never served by the same query. Query shape discipline is defining exactly what data each endpoint needs and writing queries to match.

---

# Core Concepts

- **List view**: 10-20 items, 1-3 columns per item, 1 eager loaded relationship, no large text fields.
- **Detail view**: 1 item, all columns, multiple relationships, computed attributes.
- **Anti-pattern**: Reusing a `Post::with('comments', 'author', 'tags', 'likes', 'metadata')` for both list and detail endpoints.

---

# Patterns

**Separate scopes**: `scopeForList($q)` with minimal selects and narrow eager loads. `scopeForDetail($q)` with full data.

**API Resource per view**: `PostListResource` (sparse) and `PostDetailResource` (full).

---

# Related Knowledge Units

2.27 API resource classes | 4.14 Eager loading depth governance
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

## Common Mistakes

- **Assuming insertOrIgnore succeeds for all rows**: insertOrIgnore silently skips duplicate rows without feedback. Developers often assume all rows were inserted, leading to data inconsistency. Always verify row counts or use upsert when feedback is needed.
- **Mixing insertOrIgnore with model events**: Unlike create() or save(), insertOrIgnore does not fire Eloquent model events (retrieved, creating, created, etc.). Relying on event-driven logic with insertOrIgnore leads to silent failures in observers and event listeners.
- **Batch size imbalance**: Very large batch inserts (>1000 rows) can exceed database parameter limits (max_allowed_packet, max_connections) or cause transaction log overflow. Split large inserts into manageable batches of 100-500 rows.
- **Ignoring query shape**: The structure of SQL queries (which tables, joins, filters, and sort orders) determines index effectiveness. Maintaining consistent query shapes enables index reuse and query plan stability. Drastic query shape changes between deploys can cause performance regressions.
- **Not profiling before optimizing**: Premature query optimization based on assumptions rather than profiling data leads to wasted effort. Always use EXPLAIN, query logs, and profiling tools to identify actual bottlenecks before rewriting queries.
- **Missing index maintenance**: Over time, heavily written indexes fragment and lose performance. Schedule regular index rebuilds for tables with high write volume.
