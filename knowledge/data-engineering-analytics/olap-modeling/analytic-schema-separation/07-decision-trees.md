# Metadata

**Domain:** Data Engineering & Analytics
**Subdomain:** Read Models & CQRS for Analytics
**Knowledge Unit:** PostgreSQL Analytic Schema Separation (public vs analytics)
**Generated:** 2026-06-03

---

# Decision Inventory

---

# Architecture-Level Decision Trees

---

## Same-Database Schema Separation vs Dedicated Analytics Database

---

## Decision Context

Choosing between logical schema separation (same database) and a physically separate analytics database.

---

## Decision Criteria

* architectural
* maintainability
* performance

---

## Decision Tree

Is analytics data volume < 100GB and query patterns OLTP-friendly?
↓
YES → Use schema separation in the same database — analytics.* schema alongside public.*
        ↓
        Is the operational database already CPU/IO-bound from application traffic?
        YES → Consider a separate analytics database or read replica — analytics queries compete for resources even in a different schema
        NO → Schema separation is sufficient — zero additional infrastructure, logical isolation
NO → Use a dedicated analytics database or migrate to ClickHouse/warehouse
        ↓
        Is the team already using PostgreSQL and wants to stay?
        YES → Use a dedicated PostgreSQL analytics database on a separate server or read replica
                ↓
                Does the application need to JOIN analytics data with operational data?
                YES → Use pg_clickhouse FDW or foreign data wrapper to access the analytics database from the primary connection
                NO → Separate database with independent connection is cleaner
        NO → Use ClickHouse or a cloud warehouse for analytics-optimized storage and query performance

---

## Rationale

Schema separation in the same database is the most cost-effective starting point for analytics. It provides logical isolation without infrastructure cost. Migration to separate resources happens when data volume or query complexity outgrows the single database.

---

## Recommended Default

**Default:** Start with analytics.* schema in the same PostgreSQL database; migrate to separate database when data exceeds 100GB or operational queries contend
**Reason:** Zero infrastructure cost; works for years at most scales; migration path is well-understood

---

## Risks Of Wrong Choice

Same database for 200GB analytics: query performance degrades, vacuum struggles, application performance impacted; separate database for 10GB analytics: unnecessary infrastructure complexity and cost

---

## Related Rules

K019: Dedicated Database Connection for Analytics, K019: Schema-Qualified Table Names

---

## Related Skills

Implement Analytic Schema Separation

---

## Materialized View Refresh Strategy

---

## Decision Context

Choosing between CONCURRENTLY and non-concurrent materialized view refresh strategies.

---

## Decision Criteria

* performance
* reliability
* maintainability

---

## Decision Tree

Does the materialized view need to remain queryable during refresh (zero downtime)?
↓
YES → Use REFRESH MATERIALIZED VIEW CONCURRENTLY
        ↓
        Does the MV have a unique index?
        YES → CONCURRENTLY will work — refresh runs without locking reads
                ↓
                Is the refresh I/O-intensive and does it overlap with peak traffic?
                YES → Schedule refresh during low-traffic periods — CONCURRENTLY avoids locking but still consumes I/O and CPU
                NO → CONCURRENTLY refresh is safe anytime — no reader blocking
        NO → Add a unique index first — CONCURRENTLY fails silently without one; the MV will not refresh
NO → Use standard REFRESH MATERIALIZED VIEW (non-concurrent)
        ↓
        Can the table tolerate a brief write lock during refresh?
        YES → Non-concurrent refresh is faster and simpler — no unique index required
        NO → Use CONCURRENTLY or schedule refresh during a maintenance window

---

## Rationale

REFRESH MATERIALIZED VIEW CONCURRENTLY requires a unique index and is slower than non-concurrent refresh, but it does not block reads. Without a unique index, CONCURRENTLY fails silently with no error — the MV appears to refresh but remains stale.

---

## Recommended Default

**Default:** CONCURRENTLY refresh with a unique index on all materialized views that serve dashboards
**Reason:** Avoids downtime during refresh; dashboards are always queryable

---

## Risks Of Wrong Choice

Non-concurrent refresh during business hours: MV locked for seconds to minutes, dashboards time out; CONCURRENTLY without unique index: refresh fails silently, dashboard data goes stale

---

## Related Rules

K019: Add Unique Index to Every Materialized View, K019: Schedule MV Refreshes During Low Traffic

---

## Related Skills

Implement Analytic Schema Separation, Build Materialized View Pipelines

---

## Read-Only User for BI Tools

---

## Decision Context

Creating database users for external BI tools (Metabase, Grafana) to access the analytics schema.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Will the BI tool need write access to analytics tables?
↓
YES → Reconsider — BI tools should be read-only; writes by BI tools cause stale data and write conflicts
        ↓
        Is there a legitimate need for the BI tool to create temporary tables for staging?
        YES → Create a separate schema (analytics_staging) for BI tool writes — keep the main analytics schema read-only for the BI tool
                ↓
                Implement cleanup: scheduled job drops staging tables older than 24 hours
        NO → Keep the BI user read-only — the application is the sole writer to the analytics schema
NO → Create a read-only user with SELECT on analytics.* only
        ↓
        Is the application multi-tenant?
        YES → Implement row-level security (RLS) policies on analytics views — the read-only user sees only permitted rows
                ↓
                Does the BI tool need per-tenant data?
                YES → Use per-tenant schemas (analytics_tenant_1, analytics_tenant_2) or RLS with current_setting()
                        ↓
                        RLS approach → Set app.current_tenant_id at session start in the BI tool; policies filter rows automatically
                        Per-tenant schema → Grant SELECT on the specific tenant's schema to the BI user
                NO → Single analytics schema with all data aggregated is fine for internal BI
        NO → Read-only user on analytics.* is sufficient — no additional access controls needed

---

## Rationale

A read-only database user is the last line of defense against accidental or malicious data modification through BI tools. The BI tool's SQL interface bypasses application-level permissions — database-level read-only access enforces the boundary.

---

## Recommended Default

**Default:** Create analytics_reader role with SELECT on analytics.* only; set connection limits and statement timeout
**Reason:** Non-negotiable security boundary; prevents the most common BI misconfiguration

---

## Risks Of Wrong Choice

BI user with write access: accidental DROP TABLE or UPDATE through SQL editor deletes analytics data; full table access without views: schema changes break dashboards; no timeout: runaway query saturates database CPU

---

## Related Rules

K019: Read-Only Database User for BI Tools, K019: Granting ALL PRIVILEGES is an Anti-Pattern

---

## Related Skills

Implement Analytic Schema Separation, Configure BI Tools
