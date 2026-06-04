# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.17 Nulls NOT DISTINCT (PostgreSQL 15+ unique indexes allowing nulls)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

In standard SQL, `NULL` values are considered distinct in unique indexes, allowing multiple rows with `NULL` in a unique column. PostgreSQL 15+ introduced `NULLS NOT DISTINCT` to treat NULLs as equal, enforcing single-row nullability in unique constraints.

---

# Core Concepts

- **Default behavior**: `UNIQUE INDEX (email)` allows multiple NULL emails. `NULL != NULL` in SQL.
- **NULLS NOT DISTINCT**: `CREATE UNIQUE INDEX ON users (email) NULLS NOT DISTINCT` — only one NULL allowed.
- **Soft delete interaction**: Combined with partial index `WHERE deleted_at IS NULL`, enables unique constraint on non-deleted rows.

---

# Patterns

**Single active record**: Only one row can have `current_version = NULL` while multiple can have version numbers.

**Unique nullable FK**: Enforce that at most one row has a NULL parent_id.

---

# Related Knowledge Units

3.11 Partial indexes | 15.5 NULLS NOT DISTINCT | 15.11 Soft delete unique constraints
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

## Common Mistakes

- **Indexing every column**: Adding indexes on every column "just in case" increases write amplification (every INSERT/UPDATE/DELETE must update each index), bloats storage, and confuses the query planner. Only index columns used in WHERE, JOIN, ORDER BY, or GROUP BY clauses.
- **Ignoring composite index column order**: The leftmost prefix rule means column order in a composite index matters dramatically. Place high-selectivity columns first and range-filtered columns last. A wrong column order can render the index useless for common queries.
- **Not monitoring unused indexes**: Indexes that are never used by the query planner still incur write overhead and storage costs. Use pg_stat_user_indexes or performance_schema to identify and drop unused indexes.
- **Over-indexing foreign keys**: While FK columns benefit from indexing, adding separate indexes when a composite index already covers the FK leads to redundancy. Check existing indexes before adding FK-specific ones.
- **Indexing without query analysis**: Adding indexes based on column names rather than actual query patterns leads to wasted effort. Use slow query logs, EXPLAIN plans, and query profiling to identify the exact queries that need optimization.
- **Neglecting maintenance**: B-Tree indexes can bloat over time from UPDATE/DELETE activity. Schedule regular REINDEX (PostgreSQL) or OPTIMIZE TABLE (MySQL) during maintenance windows to reclaim space and improve performance.
