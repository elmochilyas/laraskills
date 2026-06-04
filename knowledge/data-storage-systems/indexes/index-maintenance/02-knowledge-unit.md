# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.19 Index maintenance (bloat, fillfactor, rebuilding, VACUUM)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Indexes degrade over time due to bloat (dead entries), fragmentation, and stale statistics. PostgreSQL uses VACUUM and REINDEX for maintenance. MySQL uses OPTIMIZE TABLE and ALGORITHM=INPLACE index rebuilds. Regular maintenance prevents performance degradation.

---

# Core Concepts

- **Bloat**: Dead index entries from UPDATE/DELETE operations. PostgreSQL B-Tree doesn't reuse dead space immediately.
- **fillfactor**: Percentage of each index page reserved for future updates. Default 90 (PostgreSQL). Lower values reduce page splits.
- **pg_repack**: Rebuilds indexes without ACCESS EXCLUSIVE lock. Essential for production.
- **REINDEX**: PostgreSQL rebuilds index from scratch. Requires exclusive lock. CONCURRENTLY option in PG 12+.

---

# Patterns

**Monitor index bloat quarterly**: Use `pgstattuple` or bloat estimation queries. Schedule REINDEX or pg_repack for tables with > 20% bloat.

**Set fillfactor for high-update columns**: If a column is frequently updated, reduce fillfactor to 70-80 so updates stay within the same page.

**Vacuum frequency**: Aggressive autovacuum reduces index bloat accumulation. Tune `autovacuum_vacuum_scale_factor` for high-write tables.

---

# Common Mistakes

**Not monitoring bloat**: Index performance degrades silently. A query that took 50ms now takes 200ms — and no index maintenance was ever run.

**REINDEX without planning**: REINDEX blocks writes. Use `REINDEX TABLE CONCURRENTLY` (PG 12+) or pg_repack for production.

---

# Related Knowledge Units

1.15 pg_repack | 3.1 B-Tree | 3.20 Concurrent index creation
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

