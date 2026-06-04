# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.5 BRIN indexes (correlated physical ordering, large append-only tables)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

BRIN (Block Range INdex) stores min/max value summaries for contiguous physical block ranges. Designed for append-only tables where data is inserted in roughly sorted order (time-series, event logs, audit trails). BRIN indexes are 100-1000x smaller than B-Tree indexes and perform well on range queries over correlated data.

---

# Core Concepts

- **Block range summary**: Each index entry covers a range of physical blocks (default 128 blocks, ~1MB). Stores min and max value for the indexed column.
- **Correlation requirement**: BRIN is effective only when data insertion order correlates with indexed column value (time-series, monotonically increasing IDs).
- **Size advantage**: For a 1TB table, a B-Tree on a timestamp column might be 30GB. A BRIN index might be 10-50MB.
- **Range query performance**: Excellent for `WHERE timestamp > '2026-01-01' AND timestamp < '2026-02-01'`. Poor for point lookups.

---

# Mental Models

BRIN is a coarse index that divides the table into block ranges and remembers the value range in each. Queries eliminate entire block ranges that can't contain matching rows. Like knowing which subway car range (blocks 1-128 are January data, blocks 129-256 are February data).

---

# Patterns

**Time-series data**: Event logs, metrics, audit trails inserted in chronological order. BRIN on timestamp enables fast date-range queries.

**append-only tables**: Tables where UPDATE/DELETE are rare. Heavy UPDATE/DELETE degrades BRIN effectiveness.

**Monitoring and observability**: pg_stat_statements data, request logs, background job history.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
0.1-1% of B-Tree size | Slow for point lookups | Not suitable for PK or FK columns
Fast range queries on correlated data | Degrades with non-correlated inserts | Must maintain insertion order correlation
Minimal write amplification | VACUUM may not update summaries | Periodic REINDEX needed for fresh statistics

---

# Common Mistakes

**BRIN on randomly distributed data**: UUID primary key inserted randomly across the table. Each block range covers almost the entire value range. Every query scans all blocks. Use B-Tree instead.

**Not choosing optimal pages_per_range**: Default (128) is a starting point. Lower values (32) = more precise but larger index. Higher (256) = smaller index but coarser filtering. Tune based on query patterns.

---

# Related Knowledge Units

3.1 B-Tree | 3.19 Index maintenance | 8.1 Range partitioning | 8.7 Time-based partitioning
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

