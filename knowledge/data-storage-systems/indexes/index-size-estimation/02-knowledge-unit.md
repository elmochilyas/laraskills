# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.22 Index size estimation and monitoring
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Index size affects buffer pool efficiency, storage cost, and backup time. Monitor index-to-table size ratio. PostgreSQL: `pg_indexes_size()`, `pg_stat_user_indexes`. MySQL: `INFORMATION_SCHEMA.INNODB_INDEXES`, `performance_schema`.

---

# Core Concepts

- **Index-to-data ratio**: Typical ratio: 0.5-2x for B-Tree indexes. Higher ratios indicate over-indexing.
- **Buffer pool fit**: Indexes must fit in memory for optimal performance. Monitor buffer pool hit rate.
- **Unused indexes**: `pg_stat_user_indexes` (idx_scan = 0) or MySQL `sys.schema_unused_indexes` identifies indexes never used.

---

# Patterns

**Estimate before creating**: Calculate approximate index size: indexed columns width * row count * fillfactor overhead.

**Cleanup unused indexes quarterly**: Drop indexes with zero scans over 30 days. Re-evaluate if queries later need them.

---

# Common Mistakes

**Ignoring index size on memory-constrained systems**: Large indexes that don't fit in buffer pool cause constant page swapping, degrading performance.

---

# Related Knowledge Units

3.19 Index maintenance | 3.23 Over-indexing risks
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

