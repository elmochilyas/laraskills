# Skills: ETL Manifesto YAML Configuration

## Skill: Building an ETL Manifest Pipeline
**Purpose:** Create a declarative ETL pipeline using YAML manifest configuration.
**When to use:** Exporting denormalized analytics data from Laravel Eloquent models.
**Steps:**
1. Identify the data domain and define the entity in the manifest
2. Configure relationships and eager loading strategy
3. Define field mappings from source model to output fields
4. Configure transformations (aggregations, computed columns)
5. Set output target (CSV file, database table, JSON)
6. Implement chunked processing for large datasets
7. Write automated tests for pipeline output
8. Add manifest validation to CI pipeline

## Skill: Manifests for Medallion Architecture
**Purpose:** Use ETL manifests to feed data into medallion architecture layers.
**When to use:** Integrating Laravel ETL output with a medallion-architected data warehouse.
**Steps:**
1. Identify which models feed which medallion layer (Bronze = raw, Silver = cleaned)
2. Create manifests for Bronze layer: minimal transformation, raw data
3. Create manifests for Silver layer: typed fields, resolved relationships
4. Create manifests for Gold layer: aggregated metrics, denormalized marts
5. Configure output targets per layer
6. Implement idempotent loading (overwrite for full refresh, merge for incremental)
7. Coordinate manifest execution order respecting layer dependencies
