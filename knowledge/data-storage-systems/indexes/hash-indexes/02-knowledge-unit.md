# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.2 Hash indexes (equality only, PostgreSQL)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Hash indexes in PostgreSQL store a 32-bit hash code of the indexed value, enabling fast equality lookups. They are smaller than B-Tree indexes for equality-only queries but do not support range queries, sorting, or prefix matching. WAL-logged since PostgreSQL 10.

---

# Core Concepts

- **Hash function**: Computes a 32-bit hash of the key. Index stores (hash, TID) pairs.
- **Equality only**: `WHERE col = ?` can use hash index. `WHERE col > ?`, `ORDER BY col`, `LIKE` cannot.
- **Collisions**: Hash collisions are handled by storing multiple entries per hash value.
- **WAL logging**: Pre-PostgreSQL 10, hash indexes were not WAL-logged and were lost on crash. Since PG 10, they are fully crash-safe.

---

# Mental Models

Hash indexes are lookup tables optimized for one thing: finding the row by exact key value. No ordering, no ranges — just "find this exact value fast."

---

# Patterns

**Use when B-Tree is overkill**: Single-column equality lookups on large tables where the index is primarily used for WHERE conditions with no ORDER BY.

**Smaller than B-Tree**: Hash index typically uses less storage than B-Tree for the same column (no tree structure, just hash buckets).

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Smaller storage than B-Tree | No range queries, no ORDER BY, no prefix matching | Cannot serve multi-purpose queries
Good equality performance | Hash collisions degrade with many equal values | Rarely better than B-Tree for most workloads

---

# Common Mistakes

**Using hash when B-Tree is needed**: Adding a hash index for a column that later requires range queries or ORDER BY. Must switch to B-Tree.

---

# Related Knowledge Units

3.1 B-Tree index structure | 3.4 GIN indexes | 3.5 BRIN indexes
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

