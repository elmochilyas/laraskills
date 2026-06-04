# Skills: Snowflake/BigQuery Eloquent Driver Setup and Migration Support

## Skill: Configuring Snowflake Eloquent Driver
**Purpose:** Set up and configure the Snowflake Eloquent driver for Laravel.
**When to use:** Integrating Snowflake as an analytics backend for a Laravel application.
**Steps:**
1. Install `foundry-co/laravel-snowflake` package
2. Configure Snowflake connection in `config/database.php`
3. Set read-only database user
4. Create models extending Snowflake model class
5. Configure warehouse and role settings
6. Test query execution with EXPLAIN
7. Implement caching layer for frequent queries

## Skill: Cost-Effective BigQuery Queries from Laravel
**Purpose:** Write Eloquent queries that minimize BigQuery bytes scanned.
**When to use:** Building Laravel reports on BigQuery analytics data.
**Steps:**
1. Identify partition columns on BigQuery tables
2. Always include partition filters in WHERE clauses
3. Use explicit column selection (not SELECT *)
4. Implement query result caching
5. Monitor bytes billed per query
6. Set up cost alerts based on query patterns
7. Optimize slow queries using BigQuery's execution details
