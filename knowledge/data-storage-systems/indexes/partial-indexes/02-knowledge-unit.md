# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.11 Partial indexes (WHERE clause on index, PostgreSQL)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Partial indexes index only a subset of rows matching a `WHERE` condition. They are smaller, faster to maintain, and more targeted than full-table indexes. Common use cases: index only active records, unprocessed queue items, or non-deleted rows. PostgreSQL exclusive (MySQL does not support partial indexes).

---

# Core Concepts

- **WHERE predicate**: `CREATE INDEX idx_active_users ON users (email) WHERE status = 'active'`. Only rows with `status = 'active'` are in the index.
- **Query matching**: The query's WHERE clause must match or imply the index predicate. PostgreSQL recognizes implied predicates.
- **Size benefit**: An index on 20% of rows is ~20% the size of a full index. Write maintenance is similarly reduced.

---

# Mental Models

A partial index is a focused index that only cares about a subset of rows. Other rows are invisible to it — they don't consume index space and don't cause index updates.

---

# Patterns

**Filtered status queries**: Index on `(tenant_id, created_at)` WHERE `status = 'pending'` — optimized for "show me pending orders" queries.

**Soft delete optimization**: `CREATE INDEX ON users (email) WHERE deleted_at IS NULL` — unique email constraint only for non-deleted users.

**Queue processing**: Index on unprocessed queue items. Items are removed from the index (by updating their status) when processed.

**Archived data exclusion**: Most queries filter `WHERE archived = false`. Partial index on active data keeps the index small and fast.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Smaller, faster, cheaper to maintain | Only serves queries matching the predicate | Queries without the predicate get no index benefit
Reduced write amplification | Predicate mismatch causes full scan | Must ensure query WHERE implies index WHERE
Lower storage cost | PostgreSQL only | Not available in MySQL

---

# Common Mistakes

**Query predicate doesn't match index predicate**: Index `WHERE status = 'active'` but query `WHERE status = 'active' AND plan = 'premium'`. PostgreSQL recognizes this as matching (the index predicate is implied by the query). However, `WHERE status IN ('active', 'pending')` does NOT match.

**Partial index on volatile columns**: Status changes frequently. Each change requires deleting+inserting the index entry. On a table with rapid status changes, the partial index maintenance overhead may exceed the benefit.

---

# Related Knowledge Units

3.1 B-Tree | 3.27 Soft delete column indexing | 15.11 Soft delete with unique constraints
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

