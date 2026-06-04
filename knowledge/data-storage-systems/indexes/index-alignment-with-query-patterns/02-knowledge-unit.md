# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.26 Index alignment with WHERE + JOIN + ORDER BY patterns
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

An index is optimal when it aligns with the full query access pattern: WHERE conditions, JOIN conditions, and ORDER BY direction. A composite index that matches all three eliminates both full table scans and explicit sort operations.

---

# Core Concepts

- **Index matching**: The index should cover WHERE columns (for filtering), JOIN columns (for lookups), and ORDER BY columns (for sorted output).
- **Filter + Sort alignment**: Best index: equality columns → range column → sort column. The index narrows the search and provides sorted results.
- **Join index**: The FK column in the JOIN condition must be indexed on the joined table.

---

# Patterns

**Composite for filter + sort**: `WHERE tenant_id = ? AND status = ? ORDER BY created_at DESC` → Index `(tenant_id, status, created_at DESC)`.

**Covering index with INCLUDE**: Add SELECT columns to the index to avoid heap fetches.

---

# Common Mistakes

**Indexing WHERE without ORDER BY**: The index narrows the search, but the database still sorts the result. Add the sort column to the index.

---

# Related Knowledge Units

3.8 Composite indexes | 3.15 Descending indexes | 4.24 Join optimization
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

## Mental Models

An index is a sorted copy of indexed data. Finding data in a B-Tree takes as many steps as tree depth (3-4 levels for millions of rows). The query planner chooses an index when the index scan is cheaper than a full table scan.

