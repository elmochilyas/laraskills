# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 08-dashboards-reporting
**Knowledge Unit:** grafana-metabase
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Read-only database user created with SELECT-only permissions
- [ ] Database user scoped to analytics schema only (K019 schema separation)
- [ ] Grafana or Metabase data source configured with read-only credentials
- [ ] Connection pooling configured for BI tool connections
- [ ] Query timeout set per data source to prevent runaway queries
- [ ] Row-level security (RLS) applied in views for multi-tenancy

---

# Architecture Checklist

- [ ] Grafana/Metabase read-only user cannot INSERT/UPDATE/DELETE — SELECT only
- [ ] User scoped to analytics.* schema (or dedicated analytics database)
- [ ] Connection pool size configured for BI tool workload (prevent connection starvation)
- [ ] Query timeout set at data source level (Grafana: timeout, Metabase: max execution time)
- [ ] RLS policies applied via views or table-level security in PostgreSQL
- [ ] BI tool complements in-app Dashboard Widget Providers (K011) — not a replacement

---

# Implementation Checklist

- [ ] PostgreSQL: CREATE USER bi_reader WITH PASSWORD '...'; GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO bi_reader
- [ ] ClickHouse: CREATE USER bi_reader IDENTIFIED WITH sha256_password BY '...'; GRANT SELECT ON analytics.* TO bi_reader
- [ ] Grafana data source: PostgreSQL/ClickHouse with bi_reader credentials
- [ ] Metabase data source: PostgreSQL with bi_reader credentials, schema filter to analytics
- [ ] Connection pooling via PgBouncer or ClickHouse Keeper for BI connections
- [ ] RLS via PostgreSQL row-level security policy on analytics views

---

# Performance Checklist

- [ ] BI tool query latency measured at p50/p95/p99 for common dashboards
- [ ] Connection pool sized to handle peak BI tool concurrency
- [ ] Query timeout prevents resource exhaustion from runaway dashboard queries
- [ ] BI tool query cache configured at dashboard level for repeated queries
- [ ] Materialized views (K016) pre-compute heavy aggregations for BI queries
- [ ] BI tool scheduled refresh during off-peak hours for heavy reports

---

# Security Checklist

- [ ] BI reader user with MINIMAL required permissions — SELECT on analytics schema only
- [ ] No write access to any database — INSERT/UPDATE/DELETE explicitly denied
- [ ] Network-level restriction — BI tool allowed IP range
- [ ] TLS required for BI tool database connection
- [ ] RLS ensures tenant A dashboard sees only tenant A data via views
- [ ] BI tool user authentication (SSO or password) separate from database credentials

---

# Reliability Checklist

- [ ] BI tool connection retry on transient failure (Grafana connection pooling, Metabase reconnection)
- [ ] Query timeout prevents long queries from blocking other connections
- [ ] BI tool alerting configured for data source connectivity loss
- [ ] Connection pool health check — stale connections evicted
- [ ] BI tool dashboard snapshots as fallback for live data unavailability

---

# Testing Checklist

- [ ] Test read-only user cannot INSERT/UPDATE/DELETE
- [ ] Test query returns results from analytics schema only
- [ ] Test query timeout — slow query returns error within configured limit
- [ ] Test RLS — different user roles see different data from same view
- [ ] Test TLS connection — BI tool connects with encrypted transport
- [ ] Test connection pool exhaustion — maximum concurrent queries handled

---

# Maintainability Checklist

- [ ] BI user credentials stored in environment config or secret manager
- [ ] Schema access grants documented in database access control matrix
- [ ] BI tool data source configuration in version-controlled dashboard definitions (Grafana JSON, Metabase YAML)
- [ ] Query timeout and concurrency settings documented
- [ ] BI tool onboarding runbook for adding new dashboards

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use application database credentials for BI tools — creates write risk
- [ ] Do not grant CREATE on analytics schema to BI reader — prevents schema modification
- [ ] Do not skip query timeout — runaway queries can impact OLTP connection pool
- [ ] Do not expose raw operational tables — use analytics views with RLS
- [ ] Do not let BI tool replace application dashboards completely — use both patterns (K011)

---

# Production Readiness Checklist

- [ ] Prometheus metrics for BI tool query count, latency, and error rate
- [ ] Logged warning when BI query latency exceeds 2s at p95
- [ ] Alert if BI tool data source connection fails
- [ ] Connection pool usage monitored — pool exhaustion alert at 80%
- [ ] Deploy checklist includes BI tool data source health verification
- [ ] Staging BI tool validated against analytics schema before production connection

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: read-only user, schema scoping, connection pooling, query timeouts, RLS
- [ ] Security requirements satisfied: SELECT-only grants, network restrictions, TLS, RLS, separate authentication
- [ ] Performance requirements satisfied: query latency measured, pool sizing, cache, materialized views, off-peak refresh
- [ ] Testing requirements satisfied: read-only enforcement, schema isolation, timeout, RLS correctness, TLS
- [ ] Anti-pattern checks passed: no app credentials, no CREATE grant, timeouts set, analytics views exposed
- [ ] Production readiness verified: query metrics, latency alerts, connection pool monitoring, staging validation

---

# Related References

- K011 (Dashboard Widget Provider): Complementary in-app dashboard pattern
- K008 (CQRS Read Model): The analytics.* schema is a read model tier
- K019 (Analytic Schema Separation): Schema organization fundamentals
- K013 (Snowflake/BigQuery Drivers): Warehouse drivers for BI tool connections
