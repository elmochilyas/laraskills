# 3-14 Spatial Indexes - Decision Trees

## MySQL R-Tree vs PostgreSQL GiST for Spatial Queries

---

## Decision Context

Choosing the spatial index type and implementation based on the database platform.

---

## Decision Criteria

* performance: both use spatial index structures; PostGIS more feature-rich
* architectural: platform decision affects the entire application
* maintainability: PostGIS has steeper learning curve
* security: location data privacy

---

## Decision Tree

Need spatial queries (find nearby, within polygon, proximity)?

↓

Using MySQL?

YES → Use SPATIAL INDEX (R-Tree) on GEOMETRY column

    ↓
    Create: `$table->spatialIndex('location')`
    
    Query with:
    - `ST_Distance_Sphere(location, POINT(lng, lat)) < radius` (distance)
    - `MBRContains(polygon, location)` (containment)
    - `ST_Within(location, polygon)` (within boundary)
    
    ↓
    Basic spatial operations only — no advanced GIS transformations

NO → Using PostgreSQL?

    YES → Use PostGIS GiST index on geography/geometry column
    
        ↓
        Install PostGIS extension
        Add geography column: `ALTER TABLE places ADD COLUMN location geography(Point, 4326);`
        Create: `CREATE INDEX ON places USING GIST (location)`
        
        Query with:
        - `ST_DWithin(location, ST_MakePoint(lng, lat), 10000)` (within 10km)
        - `ST_Intersects(location, polygon)` (intersection)
        - `ORDER BY location <-> ST_MakePoint(lng, lat) LIMIT 10` (nearest neighbor)
        
        ↓
        Advanced: ST_Transform, ST_Buffer, ST_Union, ST_Area

---

## Rationale

PostgreSQL with PostGIS is the gold standard for spatial data, offering hundreds of spatial functions and CRS support. MySQL's spatial support is adequate for basic proximity search but lacks advanced GIS capabilities.

---

## Recommended Default

**Default:** PostgreSQL + PostGIS for serious spatial work; MySQL SPATIAL for basic proximity
**Reason:** PostGIS maturity and feature set far exceed MySQL's spatial capabilities.

---

## Risks Of Wrong Choice

MySQL for complex spatial: hitting feature limits (no ST_Buffer, limited CRS support). Not indexing spatial column at all: every spatial query does full table scan.

---

## Related Rules

* Rule 2: Always index foreign key columns

---

## Related Skills

* Apply R-Tree Indexes for MySQL Spatial Queries
* Design GiST Indexes for Geospatial and Range Queries
