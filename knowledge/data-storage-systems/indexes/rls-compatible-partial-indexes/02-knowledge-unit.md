# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.30 RLS-compatible partial indexes (index WHERE matches policy USING)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

PostgreSQL Row-Level Security (RLS) policies can cause expensive post-scan filters when indexes don't align with policy `USING` expressions. Creating partial indexes that match the RLS policy's `USING` clause enables the index to pre-filter rows before the policy is evaluated, preventing full table scans.

---

# Core Concepts

- **Policy alignment**: If RLS policy is `USING (tenant_id = current_setting('app.tenant_id')::bigint)`, a partial index `WHERE tenant_id = current_setting('app.tenant_id')::bigint` allows the planner to use the index for policy evaluation.
- **FORCE ROW LEVEL SECURITY**: Required to prevent table owner bypass. Without it, the table owner's queries skip RLS.
- **Partition propagation**: RLS policies on partitioned tables must be propagated to each partition.

---

# Patterns

**Create partial indexes matching tenant policy**: Index `WHERE tenant_id = current_setting('app.tenant_id')::bigint` — the planner recognizes the match and uses the index during policy evaluation.

**Combined with application scopes**: RLS partial indexes complement global scopes. The scope filters in the application; the RLS partial index ensures efficient enforcement at the database level.

---

# Common Mistakes

**Index doesn't match policy expression**: `USING (tenant_id = 5)` vs index `WHERE tenant_id = 5`. Exact match required. Even implicit type differences break the match.

**Table owner bypass**: Without `FORCE ROW LEVEL SECURITY`, superuser/owner queries skip RLS. The partial index for RLS is never used, but that's correct — those queries don't need it.

---

# Related Knowledge Units

5.14 PostgreSQL RLS | 12.19 Row-Level Security | 12.21 RLS-compatible index design
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

