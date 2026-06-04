# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.9 Composite index best practices: equality columns first, range columns after
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

The most important composite index design rule: place columns used in equality conditions (`=`, `IN`) before columns used in range conditions (`>`, `<`, `BETWEEN`, `ORDER BY`). This maximizes the portion of the index that can be efficiently searched.

---

# Core Concepts

- **Equality columns first**: The database can match exact values using the tree structure. Multiple equality columns can be matched exactly.
- **Range columns after**: The first range column ends the index's ability to support further columns. Subsequent columns beyond the first range column are not used for lookup.
- **ORDER BY alignment**: If the query has ORDER BY, that column should be last in the index (after all equality columns).

---

# Mental Models

Think of the index as a filter: equality columns reduce the search space to a specific point, range columns then scan forward/backward from that point. Once you encounter a range condition, you can't further narrow the search with equality on columns to the right.

---

# Patterns

**Standard pattern**: `WHERE tenant_id = ? AND status = ? AND created_at > ? ORDER BY created_at` → Index `(tenant_id, status, created_at)`. Equality filters first, range filter last.

**IN as equality**: `WHERE status IN ('a', 'b')` behaves like multiple equality conditions. The database may transform IN to multiple range scans.

**Covering sort**: If the index already sorts by the ORDER BY column, the database skips the explicit sort step. Look for "Using index" in Extra column (no "Using filesort").

---

# Common Mistakes

**Range column in leading position**: Index `(created_at, status)` for query `WHERE created_at > ? AND status = ?`. The index can't use `status` for lookup — it scans the entire date range and then filters by status.

**ORDER BY column not in index**: Query sorts by a column not in the index. The database loads all matching rows into memory and sorts them (filesort).

---

# Related Knowledge Units

3.1 B-Tree | 3.8 Composite/compound indexes | 3.10 Covering indexes | 4.4 Extra column flags
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

