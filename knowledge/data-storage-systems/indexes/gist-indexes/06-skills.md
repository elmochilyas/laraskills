# Skill: Design GiST Indexes for Geospatial and Range Queries

## Purpose

Use PostgreSQL GiST indexes for geometric data (points, polygons), range type overlaps (`&&`), full-text search, and nearest-neighbor (`ORDER BY col <-> point LIMIT 10`) queries — leveraging the generalized search tree framework for custom data types.

## When To Use

- Spatial queries (points within polygons, overlapping geometries)
- Range type exclusion constraints (tsrange, int4range)
- Nearest-neighbor searches
- Full-text search with GIN alternative

## When NOT To Use

- Simple equality queries (B-Tree or Hash is faster)
- Standard sorting (B-Tree is better)

## Prerequisites

- Understanding of operator classes for GiST
- PostgreSQL database (GiST is a PostgreSQL feature)

## Inputs

- Column with spatial/range type
- Query operators needed (@>, &&, <->, etc.)
- Data distribution for selectivity estimation

## Workflow

1. Identify spatial or range query requirements
2. Choose GiST as the index type
3. Create index: `DB::statement('CREATE INDEX ON places USING GIST (location)')`
4. Use appropriate operators: `&&` (overlap), `<->` (distance), `@>` (contains)
5. Analyze the table after creation for accurate stats

## Validation Checklist

- [ ] GiST is appropriate for the query type (spatial, range, nearest-neighbor)
- [ ] B-Tree wouldn't suffice for the query pattern
- [ ] Table analyzed after index creation
- [ ] Operator class matches the intended query operators

## Common Failures

### Using GiST for simple equality
GiST supports equality but is slower than B-Tree or Hash for that purpose.

### Not analyzing before GiST queries
PostgreSQL's planner needs accurate statistics for GiST selectivity estimates. Stale stats cause poor plan choices.

## Decision Points

### GiST vs GIN for full-text?
GIN is faster for full-text search queries but slower to update. GiST is faster to update but slower to query.

### GiST vs SP-GiST?
GiST for general spatial workloads. SP-GiST for skewed data distributions where space partitioning is beneficial.

## Performance Considerations

GiST indexes excel at spatial and range queries. They're slower than B-Tree for equality. Keep statistics up to date for optimal query plans.

## Security Considerations

GiST indexes don't affect security directly. Spatial data access should be controlled at the application/RLS level.

## Related Rules

- Use GiST for spatial, range, and nearest-neighbor queries
- Analyze tables after GiST index creation
- Prefer B-Tree for simple equality queries

## Related Skills

- Design GIN Indexes for JSONB and Full-Text
- Design SP-GiST Indexes for Skewed Data Distributions
- Apply Spatial Indexes for Geospatial Queries

## Success Criteria

- GiST index correctly serves intended spatial/range queries
- EXPLAIN confirms GiST index usage
- Tables analyzed after index creation
- Appropriate operator class selected
