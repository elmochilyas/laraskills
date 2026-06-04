# 3-7 R-Tree Indexes - Decision Trees

## MySQL Spatial Index: R-Tree vs B-Tree

---

## Decision Context

Choosing between MySQL R-Tree (SPATIAL) index and a B-Tree index for location-based queries.

---

## Decision Criteria

* performance: R-Tree for spatial queries, B-Tree cannot efficiently handle MBR
* architectural: MySQL only, requires GEOMETRY column type
* maintainability: spatial index requires correct SRID
* security: location data privacy

---

## Decision Tree

Need location-based search in MySQL?

↓

Do you have a GEOMETRY column (POINT, POLYGON, LINESTRING)?

YES → Use SPATIAL INDEX (R-Tree)

    ↓
    $table->spatialIndex('location')
    
    ↓
    Query with: ST_Distance_Sphere(), MBRContains(), ST_Within()

NO → Is location stored as separate lat/lng decimal columns?

    YES → You cannot use SPATIAL INDEX directly
    
        ↓
        Options:
        
        Option A: Add GEOMETRY column, backfill, add SPATIAL INDEX (recommended)
        Option B: B-Tree index on (lat, lng) for bounding box queries (approximate)
        
        ↓
        Which approach?
        
        Lat/lng bounding box is acceptable approximation?
        
            YES → B-Tree index on (lat, lng) with WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
            
            NO → Add POINT column with spatial index for precise distance queries

---

## Rationale

R-Tree organizes spatial objects by minimum bounding rectangles (MBR), allowing efficient pruning of non-overlapping regions. B-Tree on lat/lng can only do bounding box (rectangle) queries, not true radius/distance searches.

---

## Recommended Default

**Default:** SPATIAL INDEX on GEOMETRY column
**Reason:** The only way to get efficient spatial queries in MySQL. B-Tree on lat/lng is an approximation that cannot do true distance-based queries.

---

## Risks Of Wrong Choice

No spatial index on geometry column: every spatial query performs a full table scan. B-Tree on lat/lng for distance queries: inaccurate results (bounding box instead of circle), requires post-filtering in application.

---

## Related Rules

* Rule 2: Always index foreign key columns

---

## Related Skills

* Apply R-Tree Indexes for MySQL Spatial Queries
* Design GiST Indexes for Geospatial and Range Queries

---

## MySQL vs PostgreSQL Spatial Strategy

---

## Decision Context

Choosing between MySQL (R-Tree) and PostgreSQL (GiST/PostGIS) for spatial data storage and querying.

---

## Decision Criteria

* performance: PostGIS more feature-rich, MySQL simpler
* architectural: database platform decision, migration cost
* maintainability: PostGIS has steeper learning curve
* security: location data sensitivity

---

## Decision Tree

Which database for spatial data?

↓

Already using MySQL?

YES → Use R-Tree SPATIAL INDEX

    ↓
    Limited to MBRContains, ST_Within, ST_Distance_Sphere
    No advanced spatial operations (union, intersection, buffer)

NO → Using PostgreSQL?

    YES → Use PostGIS extension with GiST index
    
        ↓
        Full GIS capability: ST_Transform, ST_Buffer, ST_Union
        More spatial functions and data types
        Better for complex spatial analysis
    
    NO → Evaluating both?
    
        YES → PostGIS if you need advanced spatial features
            MySQL if you need basic proximity search and are already on MySQL

---

## Rationale

PostgreSQL with PostGIS is the de facto standard for serious spatial workloads, offering hundreds of spatial functions and CRS support. MySQL's spatial support is sufficient for basic location-based features (find nearby, geofencing) but lacks advanced GIS capabilities.

---

## Recommended Default

**Default:** PostgreSQL + PostGIS for advanced spatial; MySQL R-Tree for basic proximity
**Reason:** PostGIS is more mature and feature-rich. Choose MySQL only for simple use cases or when already committed to MySQL.

---

## Risks Of Wrong Choice

MySQL for advanced spatial: hitting feature limits, needing complex workarounds. PostgreSQL for simple proximity: over-engineered if only basic "find nearby" is needed.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Apply R-Tree Indexes for MySQL Spatial Queries
* Design GiST Indexes for Geospatial and Range Queries
