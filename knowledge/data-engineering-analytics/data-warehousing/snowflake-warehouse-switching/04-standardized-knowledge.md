# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** snowflake-warehouse-switching
**Difficulty:** Intermediate
**Category:** Warehouse Management
**Last Updated:** 2026-06-03

---

# Overview

Snowflake's architecture separates compute (warehouses) from storage, enabling independent scaling of query compute and per-user role-based access control. In the Laravel context, Eloquent models backed by Snowflake can dynamically switch between warehouses (for cost optimization), roles (for data access control), and databases/schemas (for multi-environment).

This allows a single Laravel application to execute dashboard queries on a small warehouse, ETL workloads on a large warehouse, and admin queries on a separate warehouse — all from the same codebase with connection-level granularity.

Engineers must care because warehouse configuration directly determines query cost and performance. Running a dashboard query on an XL warehouse costs 16x more than on an X-Small warehouse with minimal performance improvement for simple queries.

---

# Core Concepts

## Warehouse

A Snowflake warehouse is a cluster of compute resources. Warehouses can be X-Small to 6X-Large (or even larger with multi-cluster). Each warehouse has its own compute cost per credit.

## Role

A Snowflake role determines data access permissions. Roles are hierarchical and can be switched within a session to access different data or enable different operations.

## Database/Schema

Snowflake organizes data into databases and schemas. Switching database/schema enables a single Laravel connection to work with multiple environments (dev, staging, prod) or data domains.

## Data Sharing

Snowflake Data Sharing allows sharing data between Snowflake accounts without copying. The Laravel driver can query shared data as if it were local.

---

# When To Use

- Laravel applications serving mixed workloads on Snowflake (dashboards, ETL, exports)
- Cost optimization: use small warehouses for simple queries, large for complex ones
- Multi-environment setups using Snowflake databases/schemas
- Applications with role-based access control requirements
- Multi-tenant Snowflake architectures

---

# When NOT To Use

- Snowflake deployments using a single warehouse for all queries
- Applications where all queries have similar complexity
- Systems that don't use Snowflake (BigQuery, ClickHouse, Redshift)
- Single-warehouse cost optimization efforts

---

# Best Practices

## Warehouse Per Workload Type

Create at least three warehouses: `analytics_small` (dashboard queries), `analytics_medium` (reports), `analytics_large` (ETL, backfills, complex aggregations). Each has appropriate size and auto-suspend settings.

## Switch at the Query Level

Implement a service layer that selects the warehouse based on query type, not at the model level. The same model should be queryable via different warehouses depending on the use case.

## Auto-Suspend Configuration

Configure auto-suspend based on expected idle time: 1 minute for interactive warehouses (cost savings), 10 minutes for ETL warehouses (avoid interruption of batch jobs).

## Use Warehouse for Cost Attribution

Tag queries with warehouse names for cost tracking. The warehouse used for a query determines the compute cost center.

---

# Architecture Guidelines

## Connection Configuration

Configure multiple Snowflake connections in `config/database.php`, one per warehouse. Switch between them using Laravel's `DB::connection('snowflake_small')` method.

## Query Router

Implement a `WarehouseRouter` service that determines the appropriate warehouse based on query characteristics: estimated row count, complexity, user role, and time budget.

## Role Switching

Use Snowflake roles for tenant isolation within a warehouse. Switch roles after connecting to enforce tenant-specific access permissions.

---

# Performance Considerations

- Warehouse startup time: 5-30 seconds if warehouse is suspended. Keep interactive warehouses running during business hours.
- Smaller warehouses (X-Small, Small) are sufficient for most dashboard queries. Larger warehouses benefit complex ETL and large aggregations.
- Multi-cluster warehouses automatically scale out for concurrent queries. Configure `max_cluster_count` based on expected concurrency.

---

# Security Considerations

- Warehouse switching must not bypass access controls. A user switching to a larger warehouse should not gain access to additional data.
- Role switching is a security boundary. The Laravel application must manage role state carefully to prevent privilege escalation.
- Warehouse credential management: each warehouse connection should use the minimum permissions required for its workload.

---

# Common Mistakes

## Mistake: Single Warehouse for Everything

All queries run on the same X-Large warehouse. Dashboard queries are fast but cost 16x more than necessary. The warehouse auto-scales for peaks, but most of the time it's over-provisioned.

**Better approach:** Use smaller warehouses for simple queries. Reserve large warehouses for ETL and complex aggregations.

## Mistake: Warehouse Switching Without Auto-Suspend

A warehouse is created for ETL but left running 24/7. It accumulates credits even when no ETL is running. Monthly costs increase by 5x.

**Better approach:** Configure auto-suspend (5-10 minutes for ETL, 1 minute for interactive). Only pay for compute when queries are running.

## Mistake: Connection Leak from Warehouse Switching

Every query creates a new warehouse connection without reusing existing ones. Connection count grows unbounded, hitting Snowflake limits.

**Better approach:** Use Laravel's built-in connection pooling. Reuse connections per warehouse. Close connections when switching warehouses.

---

# Anti-Patterns

## Switching Warehouse Per Query
Switching warehouses on every Eloquent query by calling `->onWriteConnection()` or similar. Each switch adds connection overhead and warehouse resume latency.

**Solution:** Group queries by type. Execute all dashboard queries on one warehouse, then switch to ETL warehouse for batch jobs.

## Ignoring Warehouse Resume Time
Application code switches to a suspended warehouse and expects sub-second response. The warehouse takes 10 seconds to resume. The API call times out.

**Solution:** Pre-warm warehouses before expected usage. Set appropriate timeouts. Use `CREATE WAREHOUSE IF NOT EXISTS ... RESUME` in scheduled jobs.

## Shared Warehouse Across Tenants
All tenants share the same warehouse for analytics queries. One tenant's complex query consumes all warehouse resources, degrading performance for other tenants.

**Solution:** Use per-tenant warehouses or Snowflake's resource monitors to limit warehouse usage per query/workload.
