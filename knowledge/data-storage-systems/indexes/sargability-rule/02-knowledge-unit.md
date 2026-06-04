# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.28 Sargability rule: functions on indexed columns break index usage
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Sargability (Search ARGument ABILITY) means the query condition can use an index. A condition is sargable when the indexed column appears alone (not wrapped in a function) on one side of the comparison. `WHERE DATE(created_at) = '2026-01-01'` is NOT sargable. `WHERE created_at >= '2026-01-01' AND created_at < '2026-01-02'` IS sargable.

---

# Core Concepts

- **Non-sargable patterns**: `WHERE LOWER(email) = ?`, `WHERE YEAR(date) = 2026`, `WHERE CAST(id AS CHAR) = ?`, `WHERE DATE(col) = ?`.
- **Why it breaks indexes**: The index stores raw column values. To use the index with a function, the database would need to compute the function for every index entry and compare.
- **Fix**: Rewrite the condition without wrapping the column. Use range queries instead of function extraction.

---

# Mental Models

The database can only use an index when it can compare the index's stored value directly to the query condition. Any transformation of the indexed column prevents this direct comparison.

---

# Patterns

**Replace WHERE DATE(col) = ? with range**: `WHERE col >= ? AND col < ?` (startOfDay to startOfNextDay).

**Replace LOWER(col) with case-insensitive collation**: Set column collation to `utf8mb4_unicode_ci` (case-insensitive by default).

**Replace YEAR(col) with range**: `WHERE col >= '2026-01-01' AND col < '2027-01-01'`.

---

# Common Mistakes

**whereDate in Laravel**: `Model::whereDate('created_at', today())` generates `DATE(created_at) = ?`. Breaks index. Use `whereBetween('created_at', [today()->startOfDay(), today()->endOfDay()])`.

**LIKE with leading wildcard**: `LIKE '%search'` — cannot use B-Tree index because the starting character is unknown.

---

# Related Knowledge Units

4.7 Sargable vs non-sargable query patterns | 4.8 whereDate sargability breakage | 4.10 Function wraps in WHERE
## Ecosystem Usage

Laravel's schema builder supports index creation through migration blueprints. Managed database providers support all major index types. Packages like tpetry/laravel-postgresql-enhanced expose PostgreSQL-specific index types.

## Failure Modes

Query planner ignores indexes when column types mismatch query parameter types. Implicit type conversion prevents index usage. Index bloat from heavy UPDATE/DELETE workloads degrades performance. Missing indexes on FK columns cause full table scans on JOIN queries.

## Performance Considerations

B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index adds write amplification. BRIN indexes are efficient for large ordered datasets.

## Production Considerations

Monitor index usage via pg_stat_user_indexes or performance_schema. Add indexes concurrently on production tables. Schedule index rebuilds during low-traffic periods. Drop unused indexes in a separate deployment.

## Research Notes

Covering indexes with INCLUDE columns reduce query latency by eliminating heap lookups. BRIN indexes are effective for ordered data with high correlation. GiST/GIN indexes support full-text search and JSONB operations.

## Internal Mechanics

B-Tree indexes store sorted key values in leaf pages. InnoDB clustered index stores entire rows in the PK leaf. PostgreSQL uses heap storage with index entries pointing to TIDs. GIN indexes build inverted lists for composite value lookups.

## Architectural Decisions

Index types: B-Tree for equality/range/sort. GIN for JSONB and full-text. GiST for geospatial and ranges. BRIN for large ordered tables. Hash for equality-only in PostgreSQL.

## Tradeoffs

Benefit: 100x faster reads. Cost: 2x slower writes per index. Benefit: Composite indexes for multi-column filters. Cost: Storage overhead for wide indexes. Benefit: Covering indexes eliminate heap lookups. Cost: Larger index storage.

