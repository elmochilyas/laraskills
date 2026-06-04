# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.15 Descending indexes (order by DESC aligned with index order)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Descending indexes store index entries in descending order, aligning with `ORDER BY col DESC` queries to avoid explicit reverse scans. Available in both PostgreSQL and MySQL 8.0+. Especially useful for queries that filter by one column and sort descending by another.

---

# Core Concepts

- **Index direction**: `CREATE INDEX ON orders (tenant_id, created_at DESC)` — stores entries in descending order for the created_at column.
- **Multi-column direction**: Each column can have its own direction. `(a ASC, b DESC)` — sorts by a ascending, then b descending.
- **Query alignment**: If the query orders by the same direction, the index provides sorted output without additional sort step.

---

# Patterns

**Latest records per group**: Index `(user_id, created_at DESC)` for queries like "get user's most recent orders".

**Timeline queries**: Index `(status, created_at DESC)` — filter by status, show most recent first.

---

# Common Mistakes

**Not needed for single-column DESC**: MySQL and PostgreSQL both reverse-scan single-column indexes efficiently. Descending indexes matter most for composite indexes.

---

# Related Knowledge Units

3.1 B-Tree | 3.9 Composite index column ordering
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

