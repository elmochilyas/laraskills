# Skill: Apply Spatial Indexes for Geospatial Queries

## Purpose

Create spatial indexes for geospatial queries — MySQL R-Tree on GEOMETRY columns and PostgreSQL GiST on geometry/geography via PostGIS — enabling efficient nearest-neighbor, containment, and distance-based queries.

## When To Use

- Finding points within a distance (radius search)
- Determining polygon containment
- Proximity ordering (nearest-first)
- Geographic data analysis

## When NOT To Use

- Simple coordinate filtering (use B-Tree on lat/lng columns)
- Non-spatial data types

## Prerequisites

- GEOMETRY or GEOGRAPHY column with proper SRID
- Spatial extension (PostGIS for PostgreSQL, built-in for MySQL)

## Inputs

- Spatial column and data type
- Query type (distance, containment, intersection)
- Coordinate reference system (SRID)

## Workflow

1. Add spatial column with proper SRID (4326 for GPS coordinates)
2. Create spatial index: MySQL `$table->spatialIndex('location')` or PostgreSQL `DB::statement('CREATE INDEX ON places USING GIST (location)')`
3. For PostgreSQL: `DB::statement('CREATE EXTENSION postgis')` first if not installed
4. Query using spatial functions and check EXPLAIN

## Validation Checklist

- [ ] Column uses geometry/geography type with correct SRID
- [ ] Spatial index exists on the column
- [ ] Query uses spatial functions (ST_DWithin, ST_Contains, <->)
- [ ] EXPLAIN shows index usage

## Common Failures

### Missing spatial index
Spatial queries without index perform full table scan. Always add spatial index.

## Decision Points

### Geometry vs Geography (PostGIS)?
Geography for GPS coordinates with distance calculations in meters. Geometry for projected coordinate systems with Cartesian math.

### MySQL R-Tree vs PostgreSQL GiST?
Both effective. PostgreSQL GiST with PostGIS is more feature-rich. MySQL R-Tree is simpler for basic spatial needs.

## Performance Considerations

Spatial indexes store MBR (Minimum Bounding Rectangle) summaries. Queries filter by MBR overlap first, then refine with exact geometry calculation.

## Security Considerations

Location data is sensitive. Ensure access controls at the application/RLS level. Consider if spatial index usage reveals location patterns.

## Related Rules

- Always create spatial index for GEOMETRY columns
- Use proper SRID for coordinate system
- Verify spatial index usage with EXPLAIN

## Related Skills

- Design GiST Indexes for Geospatial and Range Queries
- Apply R-Tree Indexes for MySQL Spatial Queries
- Design GIN Indexes for JSONB and Full-Text

## Success Criteria

- Spatial index created on geometry/geography column
- Distance, containment, and nearest-neighbor queries use index
- Proper SRID selected for the coordinate system
- EXPLAIN confirms index usage
