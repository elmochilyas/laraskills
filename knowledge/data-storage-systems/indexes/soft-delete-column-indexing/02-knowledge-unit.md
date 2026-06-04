# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.27 Soft delete column indexing impact (deleted_at as filter)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Soft deletes add `WHERE deleted_at IS NULL` to every query. Without a properly designed index, this additional filter degrades query performance on large tables. The `deleted_at` column should be part of composite indexes, not queried in isolation.

---

# Core Concepts

- **Automatic filter**: `SoftDeletes` trait registers a global scope adding `WHERE deleted_at IS NULL`.
- **Selectivity**: `deleted_at IS NULL` is highly selective when most rows are active (not soft-deleted). Low selectivity when most rows are soft-deleted.
- **Composite integration**: `deleted_at` should be the last column in composite indexes that cover the query's other filter columns.

---

# Patterns

**Composite with deleted_at**: Index `(tenant_id, status, deleted_at)` — the query filters by tenant, status, and non-deleted. The soft delete filter uses the last column.

**Partial index for PostgreSQL**: `CREATE INDEX ON orders (tenant_id, status) WHERE deleted_at IS NULL` — only indexes active rows, reducing index size.

---

# Common Mistakes

**Indexing deleted_at alone**: An index on just `deleted_at` is rarely used — 50-90% of rows are IS NULL, making the index less efficient than a table scan.

**Not considering soft delete in index design**: Adding indexes for hot queries without including `deleted_at`. The index covers WHERE conditions but not the soft delete filter, causing residual filtering.

---

# Related Knowledge Units

3.11 Partial indexes | 15.10 Soft delete pattern | 15.11 Soft delete unique constraints
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

