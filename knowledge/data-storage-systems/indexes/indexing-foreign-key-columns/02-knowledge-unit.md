# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.24 Indexing foreign key columns (automatic via constrained)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Foreign key columns must be indexed for JOIN performance. Laravel's `->constrained()` automatically adds an index. Manual FK definitions do NOT. Unindexed FK columns cause full table scans on every JOIN.

---

# Core Concepts

- **constrained() auto-index**: `$table->foreignId('user_id')->constrained()` creates FK constraint AND index.
- **Manual FK without index**: `$table->foreign('user_id')->references('id')->on('users')` creates FK constraint only. No index. Full table scan on every JOIN.
- **MySQL InnoDB**: Automatically indexes FK columns if no index exists. PostgreSQL does not.

---

# Patterns

**Always use constrained()**: Reduces FK errors and ensures indexes exist. Exception: when custom index name or type is needed.

**Verify indexes in code review**: Check that all FK columns have indexes. Look for `foreign()` without `index()` as a red flag.

---

# Common Mistakes

**Manual FK without index**: The most common FK performance mistake. JOIN queries on the FK column perform full table scans.

---

# Related Knowledge Units

1.4 Foreign key definition | 15.2 Foreign key index requirements
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

