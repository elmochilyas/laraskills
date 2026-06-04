# Anti-Patterns: Grafana/Metabase Read-Only Integration

## BI Tool on Primary Database
Grafana queries the primary database directly. A complex aggregation scans the full orders table. The query blocks autovacuum and other maintenance operations. Primary database performance degrades.

**Solution:** Point BI tools to a read replica. If no read replica exists, provision one before integrating BI tools.

## Full Database Access for BI User
The BI tool's database user has `SELECT ON ALL TABLES IN SCHEMA public`. Sensitive tables (password resets, personal access tokens, audit logs) are queryable by any Metabase user.

**Solution:** Create an analytics schema. Grant SELECT only on that schema. Move analytics views to that schema.

## No Query Timeout Configured
A Metabase user runs a report without filtering by date. The query scans 5 years of data. It runs for 20 minutes, consuming the connection pool and blocking other queries.

**Solution:** Set `statement_timeout = '30s'` at the database user level. Educate BI users on query optimization.

## No Connection Pooling
Grafana opens 100 connections when loading a dashboard with 20 panels. The database `max_connections` is 100. Application connections are rejected. Users see 500 errors.

**Solution:** Use PgBouncer. Configure a dedicated pool for BI tools. Ensure the pool size leaves room for application connections.
