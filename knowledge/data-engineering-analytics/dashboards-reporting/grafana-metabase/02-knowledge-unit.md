# Grafana and Metabase Integration

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 08-dashboards-reporting
- **Knowledge Unit:** grafana-metabase
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Grafana and Metabase provide external BI dashboarding against Laravel application databases through a standard integration pattern: a read-only database user scoped to the `analytics.*` schema (or dedicated analytics database) prevents external BI tools from mutating operational data. This pattern enables rich visualization without embedding dashboard logic in the Laravel application, while maintaining strict security boundaries between OLTP and OLAP query paths.

---

## Core Concepts

- **Read-Only User:** PostgreSQL or MySQL user with SELECT-only privileges — used exclusively by BI tool — no INSERT, UPDATE, DELETE, or DDL privileges granted
- **Schema Scoping:** Read-only user restricted to `analytics` schema or specific tables — operational tables (users, orders_raw) invisible to BI tool
- **Connection Pooling:** BI tools can open many simultaneous connections — PgBouncer manages connection load, preventing exhaustion of database connections
- **Query Timeouts:** Database-side query timeouts (`statement_timeout` in PostgreSQL) prevent runaway BI queries from degrading operational database performance
- **Row-Level Security (RLS):** For multi-tenant applications, RLS policies ensure each tenant's BI users can only query their own data

---

## Mental Models

- **BI Tool as Read-Only Visitor:** Grafana/Metabase is a visitor to your database with a visitor badge (read-only user) that only allows entry to certain rooms (analytics schema). The visitor can look at exhibits but cannot touch anything, open locked doors (operational tables), or invite friends without badges.
- **Analytics Schema as Museum Exhibit:** The analytics schema is a curated museum exhibit — it contains only the data that's safe and useful for visitors to see. Everything behind the scenes (operational data) is kept in staff-only areas (other schemas). The exhibit is updated regularly (materialized views, scheduled refreshes).

---

## Internal Mechanics

A dedicated analytics database user is created with `GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO bi_user`. The BI tool connects using this user's credentials. Connection pooling through PgBouncer manages concurrent connections. `statement_timeout` is set at the user or database level (typically 30 seconds). For multi-tenant setups, RLS policies are configured on analytics tables, and the BI user is assigned roles that enforce tenant scoping.

---

## Patterns

- **Create Dedicated Analytics Schema:** Create a dedicated `analytics` schema containing materialized views, denormalized tables, or projections optimized for BI queries — the BI tool only has access to this schema
- **Use Read-Only Replica:** Point BI tools to a read replica, not the primary database — isolates BI query load from the write path
- **Set Statement Timeout:** Configure `statement_timeout` at user or database level — start with 30 seconds, adjust based on BI tool requirements

---

## Architectural Decisions

Use Grafana for time-series monitoring and operational dashboards (real-time metrics, system health). Use Metabase for ad-hoc business intelligence (drag-and-drop queries, scheduled reports, email snapshots). Always use a read-only database user. Always scope the user to the analytics schema. Use a read replica when available. Never connect BI tools to the primary database with full table privileges.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Rich visualization without app code | Direct database access risk | Read-only user and schema scoping mitigate |
| Self-service analytics for business teams | Unpredictable query patterns | Query timeouts prevent runaway queries |
| Scheduled reports and alerting | Requires separate BI infrastructure | Connection pooling manages load |
| Ad-hoc query capability | Data governance overhead | Analytics schema curation needed |

---

## Performance Considerations

BI tool queries can be unpredictable — set query timeouts and concurrency limits. Read replicas absorb BI query load without impacting the primary. Materialized views dramatically improve BI query performance for common aggregations. Connection pools reduce database connection overhead.

---

## Production Considerations

The BI tool's database user must have SELECT on analytics schema only — never grant access to operational tables. Set `statement_timeout = '30s'` on the BI user to prevent runaway queries. Use PgBouncer to limit connection pool size. Track slow queries originating from the BI tool — identify queries needing optimization or materialized views.

---

## Common Mistakes

- **BI Tool on Primary Database:** Grafana connects directly to primary PostgreSQL — heavy Grafana query scans entire orders table, blocks writes for 10 seconds. Better: connect BI tools to a read replica.
- **Full Table Privileges:** BI tool's database user has SELECT on all tables including `users.password_reset_tokens` — security exposure. Better: create dedicated analytics schema with only needed tables and views.
- **No Query Timeout:** Business analyst writes Cartesian join in Metabase — query runs for 15 minutes, consumes 100% CPU, other queries starved. Better: set `statement_timeout = '30s'` on BI database user.

---

## Failure Modes

- **BI Tool Connection Exhaustion:** Grafana opens 50 concurrent connections during dashboard loading — database reaches `max_connections`, rejects legitimate application connections. Mitigation: use PgBouncer, limit BI tool connection pool.
- **Materialized View Staleness:** BI tool queries materialized view refreshed every hour — business decision made on 45-minute-old data. Mitigation: document refresh cadence, set expectations for data freshness.
- **RLS Misconfiguration:** Multi-tenant RLS policy incorrectly configured — Tenant A's BI user sees Tenant B's data. Mitigation: test RLS with multiple tenant accounts before production deployment.

---

## Ecosystem Usage

Grafana and Metabase are external tools that connect to the Laravel application's database via PostgreSQL/MySQL connections. Laravel does not directly integrate with them — the integration is at the database level. The dashboard widget provider pattern in Laravel is used for in-app dashboards, while Grafana/Metabase serve as complementary external BI tools for ad-hoc analysis and scheduled reporting.

---

## Related Knowledge Units

### Prerequisites
- Read Models — The analytics schema data that BI tools query
- Star Schema — Gold layer structure optimized for BI tools

### Related Topics
- Dashboard Widget Provider — In-app dashboards vs external BI
- Warehouse Cost Optimization — Cost considerations for BI tool queries

### Advanced Follow-up Topics
- dbt Semantic Layer — Alternative metric definition layer for BI tools
- Row-Level Security — Multi-tenant data isolation for BI access

---

## Research Notes

The standard BI integration pattern — read-only user, analytics schema, read replica — has become industry best practice for connecting external BI tools to application databases. The most common failure is connecting BI tools to the primary database without restrictions, causing performance degradation or security exposure. The effort invested in curating an analytics schema with materialized views and denormalized tables pays dividends in BI tool performance and data governance.
