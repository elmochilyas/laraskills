# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.21 Index management in Laravel migrations (index, unique, fullText, spatial, raw DB::statement)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's Schema builder supports index creation via Blueprint methods: `->index()`, `->unique()`, `->fullText()`, `->spatial()`. For advanced indexes (partial, expression, concurrent, custom names), raw `DB::statement()` is required.

---

# Core Concepts

- **Standard indexes**: `$table->index(['col1', 'col2'])` — composite B-Tree.
- **Unique indexes**: `$table->unique('email')` — unique constraint.
- **Full-text**: `$table->fullText('body')` — MySQL FULLTEXT.
- **Spatial**: `$table->spatialIndex('location')` — MySQL R-Tree.
- **Raw DDL**: `DB::statement('CREATE INDEX CONCURRENTLY ...')` — for features not supported by Blueprint.

---

# Patterns

**Composite indexes in migrations**: Always define composite indexes at migration time, not as separate single-column indexes.

**Named indexes**: `$table->index(['a', 'b'], 'idx_my_name')` — explicit naming prevents auto-generated name collisions.

**Raw for advanced types**: PostgreSQL partial/expression indexes, CONCURRENTLY, and MySQL-specific DDL require raw SQL.

---

# Common Mistakes

**Not using composite indexes**: Creating individual indexes on `(tenant_id)`, `(status)`, `(created_at)` instead of one composite `(tenant_id, status, created_at)`.

**Indexing without understanding query patterns**: Adding indexes before profiling what queries actually run.

---

# Related Knowledge Units

1.5 Index definition via migrations | 3.8 Composite indexes
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

