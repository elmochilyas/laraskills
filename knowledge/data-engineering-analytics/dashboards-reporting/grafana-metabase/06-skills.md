# Skills: Grafana/Metabase Read-Only Integration

## Skill: Setting Up Grafana with Laravel Database
**Purpose:** Connect Grafana to a Laravel application database for BI dashboards.
**When to use:** Adding external BI dashboards to a Laravel application.
**Steps:**
1. Create dedicated `analytics` schema in the database
2. Create read-only database user with schema-scoped SELECT
3. Configure `statement_timeout` on the read-only user
4. Set up PgBouncer for connection pooling
5. Connect Grafana data source using read-only user credentials
6. Create materialized views for common aggregations
7. Document available tables and views for Grafana users
8. Monitor BI query performance and optimize as needed
