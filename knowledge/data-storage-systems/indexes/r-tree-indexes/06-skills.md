# Skill: Apply R-Tree Indexes for MySQL Spatial Queries

## Purpose

Use MySQL R-Tree indexes (`SPATIAL INDEX`) on GEOMETRY columns for efficient spatial queries — proximity, containment, and intersection — enabling location-based search and geofencing on MyISAM and InnoDB tables.

## When To Use

- MySQL databases with GEOMETRY type columns
- Location-based search (find within radius)
- Geofencing (point in polygon)
- Spatial data analysis

## When NOT To Use

- PostgreSQL databases (use GiST indexes instead)
- Non-spatial data types
- Simple range queries on non-spatial columns

## Prerequisites

- MySQL 5.7+ (InnoDB spatial support)
- GEOMETRY column with proper SRID

## Inputs

- GEOMETRY column to index
- Spatial query operators needed (MBRContains, ST_Within, ST_Distance_Sphere)

## Workflow

1. Add GEOMETRY column to table in migration
2. Create spatial index: `$table->spatialIndex('location')`
3. Query using spatial functions: `->whereRaw('ST_Distance_Sphere(location, POINT(?, ?)) < 1000', [$lat, $lng])`
4. Verify with EXPLAIN that the spatial index is used

## Validation Checklist

- [ ] Column is GEOMETRY type
- [ ] SPATIAL INDEX created on the geometry column
- [ ] Query uses spatial functions (MBRContains, ST_Within, etc.)
- [ ] EXPLAIN shows index usage

## Common Failures

### No spatial index
Spatial queries without spatial index perform full table scan. Adding `SPATIAL INDEX` is essential.

### Indexing non-spatial data with spatial index
Spatial indexes are only useful for GEOMETRY type columns with spatial queries.

## Decision Points

### R-Tree vs B-Tree for spatial?
R-Tree is designed for spatial queries. B-Tree cannot efficiently handle MBR containment or proximity queries.

### MySQL R-Tree vs PostgreSQL GiST?
MySQL uses R-Tree for spatial. PostgreSQL uses GiST via PostGIS extension. The concepts are similar but syntax differs.

## Performance Considerations

Spatial indexes dramatically improve spatial query performance. Without them, every spatial query does a full table scan.

## Security Considerations

Spatial indexes don't affect security. Location data may be sensitive — ensure appropriate access controls.

## Related Rules

- Always add SPATIAL INDEX for GEOMETRY columns
- Use ST_Distance_Sphere for distance queries
- Verify spatial index usage with EXPLAIN

## Related Skills

- Design GiST Indexes for Geospatial and Range Queries
- Design B-Tree Indexes for Equality and Range Queries
- Design GIN Indexes for JSONB and Full-Text

## Success Criteria

- SPATIAL INDEX created on GEOMETRY column
- Spatial queries use index (confirmed by EXPLAIN)
- Distance, containment, and intersection queries work correctly
- No spatial queries without supporting index
