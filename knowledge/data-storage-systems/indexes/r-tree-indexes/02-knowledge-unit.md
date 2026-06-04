# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.7 R-Tree indexes (MySQL spatial data)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

R-Tree indexes are MySQL's spatial index type, used with spatial data types (POINT, LINESTRING, POLYGON). They organize spatial objects by their bounding boxes using a tree structure. Enable efficient spatial queries: proximity, containment, intersection.

---

# Core Concepts

- **Minimum Bounding Rectangle (MBR)**: Each node stores the MBR of its children. Query evaluates MBR overlap/containment to prune search space.
- **MySQL support**: Available on MyISAM and InnoDB tables with GEOMETRY columns.
- **Spatial operators**: `MBRContains()`, `MBRWithin()`, `ST_Distance_Sphere()`, `ST_Within()`.

---

# Patterns

**Location-based search**: Find all restaurants within 10km of user location using spatial index.

**Geofencing**: Determine which polygon region contains a given point.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Efficient spatial queries | Higher storage than B-Tree | Only use for spatial data
Built-in to MySQL InnoDB | Limited to MySQL/MariaDB | Not portable to PostgreSQL

---

# Common Mistakes

**No spatial index**: Spatial queries without spatial index perform full table scan. Adding `SPATIAL INDEX` is essential.

**Indexing non-spatial data with spatial index**: Spatial indexes are only useful for `GEOMETRY` type columns with spatial queries.

---

# Related Knowledge Units

3.3 GiST indexes | 3.14 Spatial indexes | 13.11 Spatial data types | 13.12 Spatial indexes
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

## Mental Models

An index is a sorted copy of indexed data. Finding data in a B-Tree takes as many steps as tree depth (3-4 levels for millions of rows). The query planner chooses an index when the index scan is cheaper than a full table scan.

