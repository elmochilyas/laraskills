# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** snowflake-warehouse-switching
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Snowflake compute/storage separation and warehouse role understood
- [ ] Dynamic warehouse switching per workload (dashboard vs ETL vs admin) configured
- [ ] Role switching for data access control per query context
- [ ] Database/schema switching for multi-environment support
- [ ] Warehouse sizing strategy aligned with cost optimization (K036)
- [ ] Grafana/Metabase integration with switched warehouse/role (K023)

---

# Architecture Checklist

- [ ] Warehouse switching logic in Laravel service provider or query middleware
- [ ] Each workload type mapped to appropriate warehouse size (X-Small for dashboards, Large for ETL)
- [ ] Role switching scoped per query — temporary role elevation, not persistent
- [ ] Database/schema switching for development, staging, and production environments
- [ ] Warehouse auto-suspend configured per workload to avoid idle cost
- [ ] Switching mechanism tested with foundry-co/laravel-snowflake driver (K013)

---

# Implementation Checklist

- [ ] Service class created: SnowflakeConnectionManager with switchWarehouse($name)
- [ ] Middleware or context resolver selects warehouse based on query purpose
- [ ] Dashboard queries routed to small warehouse via connection name override
- [ ] ETL/backfill queries routed to large warehouse via explicit connection scope
- [ ] Admin queries routed to separate warehouse with elevated role
- [ ] Session parameter setter for USE WAREHOUSE, USE ROLE, USE DATABASE

---

# Performance Checklist

- [ ] Warehouse resume time (cold start) accounted for in query timeout budget
- [ ] Dashboard warehouse set to X-Small and never suspended during business hours
- [ ] ETL warehouse set to Large and auto-suspended after job completion
- [ ] Warehouse switching overhead measured — session change vs new connection
- [ ] Multi-cluster warehouse considered for concurrent dashboard loads

---

# Security Checklist

- [ ] Role switching elevated only for admin queries — dashboard/ETL roles have minimal grants
- [ ] USE ROLE executed with privilege escalation guard (no hardcoded ACCOUNTADMIN)
- [ ] Connection config with read-only role default, admin role used only in explicitly scoped queries
- [ ] Warehouse switching logged for cost audit
- [ ] Database/schema switching scoped per environment to prevent cross-environment data access

---

# Reliability Checklist

- [ ] Warehouse resume timeout configured — query fails fast if warehouse not available
- [ ] Default warehouse connection does not require resume (always-running X-Small)
- [ ] Session-level warehouse change rolls back on connection disconnect
- [ ] Role switching idempotent — same role can be set multiple times
- [ ] Warehouse size change during query does not abort running query

---

# Testing Checklist

- [ ] Test warehouse switching — same connection runs subsequent queries on different warehouses
- [ ] Test role switching — admin query returns data that dashboard query cannot
- [ ] Test database/schema switching — environment isolation verified
- [ ] Test warehouse resume — cold start query completes within timeout
- [ ] Test switching from small to large warehouse shows lower query latency
- [ ] Test switching rollback — connection reuse resets to default warehouse

---

# Maintainability Checklist

- [ ] Warehouse configuration in config/snowflake.php with named warehouse sizes
- [ ] Workload-to-warehouse mapping documented with cost rationale
- [ ] Role definitions documented with grants per role
- [ ] Switching logic in dedicated service, not scattered across controllers
- [ ] Connection naming convention: snowflake_dashboard, snowflake_etl, snowflake_admin

---

# Anti-Pattern Prevention Checklist

- [ ] Do not switch warehouse per request — per-workload session is sufficient
- [ ] Do not use ACCOUNTADMIN role in application — use purpose-built roles
- [ ] Do not switch warehouse mid-transaction — switch before query execution
- [ ] Do not forget to resume suspended warehouse — set auto-resume = true
- [ ] Do not set same warehouse size for all workloads — defeats cost optimization

---

# Production Readiness Checklist

- [ ] Prometheus metrics for warehouse resume count, query latency per warehouse
- [ ] Logged warning when warehouse resume latency exceeds 30 seconds
- [ ] Alert if warehouse credit consumption exceeds budget threshold
- [ ] Warehouse auto-suspend timeouts documented per workload
- [ ] Deploy checklist includes warehouse configuration review
- [ ] Staging test validates all workload-to-warehouse mappings

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: workload-specific warehouses, role/database switching, anti-fication
- [ ] Security requirements satisfied: minimal default role, privilege escalation guard, environment isolation
- [ ] Performance requirements satisfied: resume time budget, business-hour availability, measured overhead
- [ ] Testing requirements satisfied: switch correctness, role isolation, environment separation, cost improvement
- [ ] Anti-pattern checks passed: per-workload not per-request, no ACCOUNTADMIN, pre-query switch
- [ ] Production readiness verified: warehouse metrics, resume alerts, cost monitoring, staging validation

---

# Related References

- K013 (Snowflake/BigQuery Drivers): Base Eloquent driver setup
- K036 (Warehouse Cost Optimization): Cost implications of warehouse switching decisions
- K023 (Grafana/Metabase): Querying Snowflake from external BI tools
