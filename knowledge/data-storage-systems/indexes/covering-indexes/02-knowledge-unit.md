# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.10 Covering indexes (index-only scans, avoid heap fetches)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

A covering index contains all columns needed by a query, allowing the database to satisfy the query entirely from the index without accessing the table (heap fetch). This eliminates the most expensive part of query execution: reading rows from the table. In PostgreSQL, this is achieved by adding non-key columns via `INCLUDE`.

---

# Core Concepts

- **Index-only scan**: The database reads only the index, never the table. Marked as "Using index" in MySQL EXPLAIN, or "Index Only Scan" in PostgreSQL.
- **Heap fetch elimination**: The index has all needed data. The database avoids the random I/O of reading table pages.
- **INCLUDE columns (PostgreSQL)**: `CREATE INDEX ON orders (tenant_id, status) INCLUDE (total)` — adds `total` to the index leaf pages without affecting the tree structure. Useful for adding payload columns without violating uniqueness or leftmost prefix rules.

---

# Mental Models

A covering index is a miniature copy of the table containing only the columns needed for a specific query. The database can answer the query without visiting the main table at all.

---

# Patterns

**Dashboard queries**: Index all columns needed for dashboard aggregation queries. The entire query runs from the index.

**List endpoints**: Include frequently selected columns in the index to avoid heap fetches.

**INCLUDE for unique indexes**: Add `INCLUDE (payload)` to a unique index to make it covering without breaking uniqueness semantics.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Eliminates heap fetches (fastest reads) | Index size increases with included columns | Larger B-Tree, more maintenance overhead
Reduces buffer pool pressure for table pages | Write amplification: more columns to update per write | Acceptable for read-heavy workloads

---

# Common Mistakes

**Over-covering**: Adding 15 columns to an index to cover a query. The index becomes nearly as large as the table, eliminating the benefit. Selectively include only the columns that reduce heap fetches.

**Not using INCLUDE in PostgreSQL**: Adding payload columns as regular index columns when they should be INCLUDE. This unnecessarily increases B-Tree depth and uniqueness constraints.

---

# Related Knowledge Units

3.1 B-Tree | 3.8 Composite indexes | 3.16 INCLUDE columns | 4.4 Extra column flags
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

