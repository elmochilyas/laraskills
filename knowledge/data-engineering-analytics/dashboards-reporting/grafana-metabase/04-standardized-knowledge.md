# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 08-dashboards-reporting
**Knowledge Unit:** grafana-metabase
**Difficulty:** Intermediate
**Category:** Business Intelligence
**Last Updated:** 2026-06-03

---

# Overview

Grafana and Metabase provide external BI dashboarding against Laravel application databases. The standard integration pattern creates a read-only database user scoped to the `analytics.*` schema (or a dedicated analytics database), preventing external BI tools from mutating operational data. This pattern enables rich visualization without embedding dashboard logic in the Laravel application, while maintaining strict security boundaries between OLTP and OLAP query paths.

Engineers must care because external BI tools fill gaps that in-app dashboards cannot: ad-hoc querying, drag-and-drop visualization, scheduled email reports, and alerting. However, direct database access from BI tools introduces security, performance, and data governance risks that must be carefully managed.

---

# Core Concepts

## Read-Only User

A PostgreSQL or MySQL user with SELECT-only privileges. This user is used exclusively by the BI tool. No INSERT, UPDATE, DELETE, or DDL privileges are granted.

## Schema Scoping

The read-only user is restricted to the `analytics` schema (or a specific set of tables). Operational tables (users, orders_raw) in the `public` or `app` schema are invisible to the BI tool.

## Connection Pooling

BI tools can open many simultaneous connections. PgBouncer or a similar connection pooler manages the connection load, preventing the BI tool from exhausting database connections.

## Query Timeouts

BI tool queries can be long-running or inefficient. Database-side query timeouts (`statement_timeout` in PostgreSQL) prevent runaway queries from degrading operational database performance.

## Row-Level Security (RLS)

For multi-tenant applications, RLS policies ensure that each tenant's BI users can only query their own data. The BI tool connection uses a role configured with the appropriate RLS policy.

---

# When To Use

- Ad-hoc data exploration by non-technical team members
- Scheduled email reports and dashboard snapshots
- Alerting based on database metrics
- Visualization types not available in the Laravel application
- Self-service analytics for business teams

---

# When NOT To Use

- Real-time operational dashboards (use in-app dashboards with WebSocket updates)
- Customer-facing analytics (use in-app dashboards for better UX control)
- Read-write analytics needs (BI tools should never mutate data)
- Simple dashboards that are adequately served by in-app widgets

---

# Best Practices

## Create Dedicated Analytics Schema

Create a dedicated `analytics` schema containing materialized views, denormalized tables, or projections optimized for BI queries. The BI tool only has access to this schema.

## Use Read-Only Replica

Point BI tools to a read replica, not the primary database. This isolates BI query load from the write path. If a read replica is not available, use the analytics schema on the primary with cautious resource limits.

## Set Statement Timeout

Configure `statement_timeout` at the user or database level. Start with 30 seconds and adjust based on BI tool requirements.

## Monitor BI Query Performance

Track slow queries originating from the BI tool. Identify queries that need optimization or materialized views.

---

# Performance Considerations

- BI tool queries can be unpredictable. Set query timeouts and concurrency limits.
- Read replicas absorb BI query load without impacting the primary.
- Materialized views dramatically improve BI query performance for common aggregations.
- Connection pools reduce database connection overhead.

---

# Common Mistakes

## Mistake: BI Tool on Primary Database

Grafana connects directly to the primary PostgreSQL database. A heavy Grafana query scans the entire orders table. The query blocks writes to the orders table for 10 seconds.

**Better approach:** Connect BI tools to a read replica. If no read replica exists, create one. Never point external BI tools at the primary write database.

## Mistake: Full Table Privileges

The BI tool's database user has SELECT on all tables, including `users.password_reset_tokens`, `personal_access_tokens`, and internal audit tables.

**Better approach:** Create a dedicated analytics schema with only the tables and views the BI tool needs. Grant SELECT only on that schema.

## Mistake: No Query Timeout

A business analyst writes a Cartesian join in Metabase. The query runs for 15 minutes, consuming 100% CPU. Other application queries are starved.

**Better approach:** Set `statement_timeout = '30s'` on the BI database user. Long-running queries are canceled automatically.

## Mistake: No Connection Pooling

Grafana opens 50 concurrent connections to the database during dashboard loading. The database reaches `max_connections` and rejects legitimate application connections.

**Better approach:** Use PgBouncer or configure a connection pool. Limit the BI tool's connection pool size.
