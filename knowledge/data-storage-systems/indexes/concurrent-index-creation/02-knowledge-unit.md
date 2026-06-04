# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.20 Concurrent index creation (PostgreSQL CONCURRENTLY, MySQL INPLACE)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Concurrent index creation prevents table locking during index builds. PostgreSQL uses `CREATE INDEX CONCURRENTLY`. MySQL uses `ALGORITHM=INPLACE LOCK=NONE`. Essential for adding indexes to large tables under live traffic.

---

# Core Concepts

- **PostgreSQL CONCURRENTLY**: Builds index in background without blocking writes. Takes 2-3x longer. Can't run inside a transaction.
- **MySQL ALGORITHM=INPLACE LOCK=NONE**: Rebuilds table in-place while allowing concurrent DML. Supports most index operations.
- **Tradeoff**: Both methods take longer than standard index creation but allow zero-downtime index addition.

---

# Patterns

**Always use CONCURRENTLY for large tables**: Any table with > 1M rows actively written to should use CONCURRENTLY.

**Single statement per transaction**: CONCURRENTLY can't run inside a transaction. Each index creation must be its own migration.

**MySQL: explicit ALGORITHM**: Specify `ALGORITHM=INPLACE LOCK=NONE` explicitly rather than relying on defaults.

---

# Common Mistakes

**CONCURRENTLY inside transaction**: PostgreSQL raises error. Must use raw `DB::statement()` outside transaction.

**Multiple CONCURRENTLY in one migration**: Each CONCURRENTLY triggers an implicit commit. Only one per migration file.

**Ignoring invalid indexes**: If CONCURRENTLY fails, the index remains in INVALID state. Must be dropped and recreated.

---

# Related Knowledge Units

1.27 Online index creation | 3.19 Index maintenance | 13.5 Online DDL
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

