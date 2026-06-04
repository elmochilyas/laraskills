# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.29 Implicit type conversion and index bypass
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Implicit type conversion (type coercion) in WHERE comparisons can bypass indexes. When a string column is compared to an integer, the database casts the column to integer, wrapping it in an implicit function and breaking sargability.

---

# Core Concepts

- **String vs integer**: `WHERE varchar_col = 0` — MySQL casts `varchar_col` to integer. Non-numeric strings become 0. Index cannot be used.
- **Fix**: Compare with the correct type. `WHERE varchar_col = '0'` or cast the input to the column's type.
- **Detection**: In EXPLAIN, look for "Using where" with type=ALL. Check CAST operations in Extra.

---

# Patterns

**Cast input, not column**: If the column is `VARCHAR`, cast the PHP value: `->where('status', (string) $request->status)`.

**Use the same type in schema**: Ensure FK columns and the PK they reference are the same type.

---

# Common Mistakes

**Eloquent's automatic type binding**: Eloquent passes values as-is to PDO. If the controller passes an integer from request validation, it compares against a string column without explicit casting.

---

# Related Knowledge Units

3.28 Sargability rule | 4.12 Type mismatch implicit casts
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

