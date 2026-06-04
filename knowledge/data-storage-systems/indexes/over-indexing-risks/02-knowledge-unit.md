# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.23 Over-indexing risks (write amplification, storage cost)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Every index adds write amplification: INSERT updates all indexes, UPDATE updates indexes on changed columns, DELETE updates all indexes. Over-indexing degrades write performance, consumes storage, and increases vacuum/maintenance overhead.

---

# Core Concepts

- **Write amplification factor**: Each index multiplies the write cost of data modifications. 5 indexes = 5x the write IO of a non-indexed table.
- **Storage cost**: Indexes can exceed data size. A table with 10 indexes may have 15x data-to-index storage ratio.
- **Vacuum load (PostgreSQL)**: More indexes = more dead tuples = more vacuum work.

---

# Patterns

**Minimum viable indexes**: Add indexes based on measured query patterns, not theoretical access paths.

**Index consolidation**: Replace multiple single-column indexes with fewer composite indexes.

**Drop unused indexes**: Use index usage statistics to identify and remove indexes with zero scans.

---

# Common Mistakes

**Index every column**: "This column might be queried someday." Indexes have costs. Add when needed, not preemptively.

**Duplicate indexes**: Composite index `(a, b)` makes separate index on `(a)` redundant. The composite serves leftmost prefix queries on `a`.

---

# Related Knowledge Units

3.22 Index size estimation | 3.19 Index maintenance
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

