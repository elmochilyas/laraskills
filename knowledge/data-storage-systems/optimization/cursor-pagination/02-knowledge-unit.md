# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.17 Cursor pagination (whereValueOrderBy, seek method)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Cursor pagination uses WHERE conditions on a unique, ordered column to paginate without OFFSET. `Model::where('id', '>', $lastId)->orderBy('id')->limit(20)`. Each page reads exactly 20 rows. Constant performance regardless of page depth. Laravel 13 supports `cursorPaginate()` built-in.

---

# Core Concepts

- **WHERE-based pagination**: `WHERE id > ? ORDER BY id LIMIT 20` — no offset, always reads 20 rows.
- **Stable sort required**: The cursor column must be unique and monotonically increasing/decreasing.
- **Laravel cursorPaginate()**: Returns `CursorPaginator` with `nextCursor` and `previousCursor`. Works with `id`, `created_at`, or any unique, ordered column.

---

# Patterns

**Default to cursorPaginate for API endpoints**: Constant O(1) performance for any page depth. Better UX (infinite scroll, load more).

**Use paginate() for numbered pages**: Cursor pagination doesn't support "Go to page 5". Use offset paginate when numbered page navigation is required.

**Cursor on created_at**: `cursorPaginate(perPage: 20, columns: ['*'], cursorName: 'cursor', cursor: $request->cursor)`.

---

# Common Mistakes

**Cursor on non-unique column**: `WHERE status > ?` — if multiple rows have the same status, pages are inconsistent. Always use a unique column or a composite (status, id).

---

# Related Knowledge Units

4.16 Offset pagination | 4.18 Keyset pagination
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

