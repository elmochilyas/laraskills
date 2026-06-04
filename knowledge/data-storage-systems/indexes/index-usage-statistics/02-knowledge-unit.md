# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.25 Index usage statistics (pg_stat_user_indexes, MySQL performance_schema)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Index usage statistics reveal which indexes are used, which are unused, and how often they're scanned. PostgreSQL: `pg_stat_user_indexes` (idx_scan, idx_tup_read, idx_tup_fetch). MySQL: `performance_schema.table_io_waits_summary_by_index_usage`, `sys.schema_unused_indexes`.

---

# Core Concepts

- **idx_scan**: Number of index scans. 0 = unused index.
- **idx_tup_read / idx_tup_fetch**: Rows read from index vs fetched from heap. High fetch ratio suggests covering index improvement opportunity.
- **sys.schema_unused_indexes (MySQL)**: Identifies indexes never used since last server restart or stats reset.

---

# Patterns

**Quarterly index audit**: Query unused indexes, validate they're still needed, drop confirmed unused.

**Covering index opportunity**: If idx_tup_fetch is high compared to idx_tup_read, consider adding INCLUDE columns.

---

# Common Mistakes

**Resetting stats without analysis**: `pg_stat_reset()` or MySQL stats reset clears usage data. Only reset after collecting and documenting findings.

---

# Related Knowledge Units

3.22 Index size estimation | 3.23 Over-indexing risks
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

