# Skills: dbt Semantic Layer + MetricFlow for Consistent Metrics

## Skill: Defining Metrics in the Semantic Layer
**Purpose:** Create consistent, reusable metric definitions using the dbt Semantic Layer.
**When to use:** Centralizing metric definitions for consumption by multiple BI tools.
**Steps:**
1. Create `semantic_models/` directory in dbt project
2. Define semantic models referencing Gold mart models
3. Add entities (primary/foreign keys), dimensions (time/categorical), and measures (aggregations)
4. Define metrics based on semantic model measures
5. Create derived metrics (ratio, expression) from base metrics
6. Add descriptions and owners to all metric definitions
7. Configure saved queries for common metric requests
8. Test metric definitions with `dbt sl list --metrics`

## Skill: Consuming Semantic Layer Metrics from Laravel
**Purpose:** Query dbt Semantic Layer metrics from a Laravel application or API.
**When to use:** Building Laravel dashboards that consume defined metrics.
**Steps:**
1. Set up Semantic Layer API endpoint and authentication
2. Install HTTP client for Semantic Layer API calls
3. Define metric query builder with dimensions, time granularity, and date range
4. Create Laravel service class wrapping Semantic Layer API
5. Configure caching for metric responses
6. Implement error handling for API timeouts or invalid metric names
7. Create dashboard widget providers using the metric service
