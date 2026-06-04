# Decomposition: 3.14 Spatial indexes (MySQL R-Tree, PostgreSQL GiST)

## Topic Overview
Spatial indexes enable efficient geospatial queries: finding points within a distance, containment within polygons, proximity ordering. MySQL uses R-Tree on GEOMETRY columns. PostgreSQL uses GiST on geometry/geography types via PostGIS extension.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
3-14-spatial-indexes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 3.14 Spatial indexes (MySQL R-Tree, PostgreSQL GiST)
- **Purpose:** Spatial indexes enable efficient geospatial queries: finding points within a distance, containment within polygons, proximity ordering. MySQL uses R-Tree on GEOMETRY columns.
- **Difficulty:** Intermediate
- **Dependencies:** 3.3 GiST indexes, 3.7 R-Tree indexes, 13.11 Spatial data types, 13.12 Spatial indexes

## Dependency Graph
**Depends on:** "3.3 GiST indexes", "3.7 R-Tree indexes", "13.11 Spatial data types", "13.12 Spatial indexes"

**Depended on by:** More advanced KUs in Indexing Strategy & Physical Design and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **MySQL R-Tree**: Automatically created via `SPATIAL INDEX`. Query operators: `MBRContains()`, `ST_Distance_Sphere()`, `ST_Within()`.; - **PostgreSQL GiST**: Via PostGIS extension. `CREATE INDEX ON places USING GIST (location)`. Operators: `ST_DWithin()`, `ST_Intersects()`, `<->` (distance).; - **SRID**: Spatial Reference ID defines the coordinate system. 4326 = WGS84 (GPS)..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization