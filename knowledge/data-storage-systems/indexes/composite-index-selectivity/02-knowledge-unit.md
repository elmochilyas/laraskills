# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.18 Composite index selectivity and cardinality analysis
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Cardinality (number of distinct values) determines index selectivity. High cardinality columns (ID, email) are highly selective — they narrow results to few rows. Low cardinality columns (status, boolean) are poorly selective. Composite index design must consider each column's cardinality and the query's access pattern.

---

# Core Concepts

- **Selectivity**: Fraction of rows returned per distinct value. `1/cardinality`. Higher = more selective = better index.
- **Cardinality distribution**: A column may have high cardinality overall but low cardinality in the queried subset.
- **Leading column selectivity**: The index's leading column should be selective enough to meaningfully reduce the search space.

---

# Patterns

**High cardinality first**: `(user_id, status)` — user_id is highly selective. The index quickly narrows to one user's records, then filters by status.

**Low cardinality as second column**: Status alone has 3 values — 33% of table per value. Leading with status is inefficient.

---

# Common Mistakes

**Misunderstanding cardinality distribution**: A column with 10 distinct values evenly distributed (10% each) is different from 10 values where one value covers 99% of rows.

**Ignoring correlated columns**: `created_date` and `created_at` have similar cardinality because they're correlated. Indexing both provides little benefit over one.

---

# Related Knowledge Units

3.8 Composite indexes | 3.9 Column ordering | 3.1 B-Tree
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

