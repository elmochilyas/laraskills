# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 05-olap-modeling
**Knowledge Unit:** analytic-schema-separation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] PostgreSQL analytics schema (analytics.*) created separate from operational schema (public.*)
- [ ] search_path configured for Laravel analytics connection to default to analytics schema
- [ ] Per-schema permissions set: analytics schema read-only for dashboard role
- [ ] Fact/dimension tables created in analytics schema (K006 integration)
- [ ] CQRS read models stored in analytics schema (K008 integration)
- [ ] Grafana/Metabase configured with read-only access to analytics schema (K023)

---

# Architecture Checklist

- [ ] analytics schema created via migration: CREATE SCHEMA IF NOT EXISTS analytics
- [ ] Operational tables remain in public schema — no analytics tables mixed in
- [ ] search_path set to analytics, public for the analytics database connection
- [ ] Analytics permissions: read-only SELECT granted to dashboard role
- [ ] CQRS projectors write to analytics schema tables (K008)
- [ ] Logical isolation achieved without separate physical database or infrastructure

---

# Implementation Checklist

- [ ] Migration: CREATE SCHEMA analytics; GRANT USAGE ON SCHEMA analytics TO dashboard_role
- [ ] config/database.php: analytics connection with 'schema' => 'analytics' search_path
- [ ] Eloquent model for analytics table: protected $table = 'analytics.daily_metrics'
- [ ] Star schema fact/dimension tables use analytics prefix in table name or schema
- [ ] CQRS projector writes read model: DB::connection('analytics')->table('daily_metrics')->insert(...)
- [ ] Grafana/Metabase data source connects with analytics schema read-only credentials

---

# Performance Checklist

- [ ] Schema isolation prevents accidental cross-schema JOINs between OLTP and analytics
- [ ] analytics schema tables vacuumed and analyzed independently
- [ ] Query planner handles schema-qualified table names efficiently
- [ ] Per-schema connection pooling sized for analytics read-heavy workload
- [ ] schema-level statistics (autovacuum) tuned for analytics tables

---

# Security Checklist

- [ ] GRANT USAGE ON SCHEMA analytics TO read_only_role with SELECT on tables
- [ ] Operational schema public.* remains restricted for analytics connection
- [ ] Per-schema permissions prevent read-only dashboard from accessing customer PII in public
- [ ] Schema-level audit logging for analytics data access
- [ ] GRANT CREATE ON SCHEMA analytics restricted to ETL pipeline only

---

# Reliability Checklist

- [ ] Analytics schema backup schedule independent of operational schema
- [ ] Schema creation idempotent — CREATE SCHEMA IF NOT EXISTS
- [ ] search_path fallback to public does not accidentally expose analytics tables
- [ ] Analytics connection failure does not affect operational database connection
- [ ] Schema migration rollback tested — revoke permissions, DROP SCHEMA ... CASCADE

---

# Testing Checklist

- [ ] Test analytics connection defaults to analytics schema search_path
- [ ] Test read-only role cannot INSERT/UPDATE on analytics tables
- [ ] Test read-only role cannot access public schema tables
- [ ] Test schema-qualified queries work without search_path (explicit analytics.table_name)
- [ ] Test storage isolation — operations in analytics schema do not affect public schema performance
- [ ] Test migration rollback drops schema and revokes permissions

---

# Maintainability Checklist

- [ ] All analytics table migrations use explicit schema prefix or connection
- [ ] Database connection naming: 'analytics' for read/write, 'analytics_read' for dashboard
- [ ] Schema separation documented in onboarding for new analytics engineers
- [ ] Per-schema permission grants documented in database access control matrix
- [ ] Migration template includes schema creation and permission grants

---

# Anti-Pattern Prevention Checklist

- [ ] Do not create analytics tables in public schema — defeats isolation purpose
- [ ] Do not grant CREATE on analytics schema to dashboard role — read-only access only
- [ ] Do not mix OLTP and analytics queries in same connection — use separate connections
- [ ] Do not forget search_path for analytics connection — defaults to public
- [ ] Do not use public schema default for analytics models — explicitly set table/schema

---

# Production Readiness Checklist

- [ ] Prometheus metrics for analytics schema query count vs operational schema
- [ ] Logged warning when analytics schema table bloat exceeds threshold
- [ ] Alert if analytics schema autovacuum falls behind
- [ ] Analytics schema storage growth tracked separately from operational schema
- [ ] Deploy checklist includes analytics schema permissions verification
- [ ] Read-only dashboard connection load-tested before production dashboard launch

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: schema creation, search_path configuration, per-schema permissions
- [ ] Security requirements satisfied: read-only dashboard role, public schema restricted, schema-level audit
- [ ] Performance requirements satisfied: independent vacuum/analyze, schema-qualified queries, connection pooling
- [ ] Testing requirements satisfied: search_path, read-only enforcement, isolation, rollback
- [ ] Anti-pattern checks passed: no analytics in public, read-only permissions, separate connections
- [ ] Production readiness verified: query metrics, bloat alerts, autovacuum, storage tracking, load testing

---

# Related References

- K008 (CQRS Read Models): Analytics tables ARE read models in the analytics schema
- K006 (Star Schema): Fact/dimension tables created in analytics schema
- K023 (Grafana/Metabase): BI tools configured with read-only access to analytics schema
