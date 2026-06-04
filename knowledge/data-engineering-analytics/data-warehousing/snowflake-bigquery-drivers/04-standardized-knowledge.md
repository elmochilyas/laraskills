# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** snowflake-bigquery-drivers
**Difficulty:** Intermediate
**Category:** Cloud Warehouse Integration
**Last Updated:** 2026-06-03

---

# Overview

Laravel's Eloquent ORM was designed for MySQL/PostgreSQL (OLTP), but community packages now extend it to Snowflake and BigQuery for OLAP workloads. These packages provide Eloquent models, query builders, schema builders, and migration support against cloud data warehouses.

The key engineering challenge is adapting OLTP ORM patterns (individual row CRUD, relationships, lazy loading) to OLAP systems that are optimized for bulk operations, columnar storage, and partitioned tables. Eloquent's design assumptions — single-row inserts, lazy relationship loading, global scopes — do not map cleanly to Snowflake/BigQuery.

Engineers must care because using cloud warehouse drivers incorrectly results in terrible performance and high costs. A `User::all()` on a BigQuery table with 1B rows costs $50 to run. Understanding the driver's capabilities and limitations is essential for cost-effective analytics.

---

# Core Concepts

## foundry-co/laravel-snowflake

An Eloquent driver for Snowflake that provides models, migrations, schema builder, and query builder. Supports Snowflake-specific features: warehouse switching, role switching, database/schema selection. Queries run through Snowflake's ODBC/JDBC interface via PDO.

## noman-sheikh/laravel-bigquery-eloquent

An Eloquent driver for BigQuery that provides query builder support. Does not fully support migrations or schema builder for all BigQuery DDL. Queries run through BigQuery's client library via REST API.

## Warehouse Differences

Snowflake separates compute (warehouses) from storage. BigQuery uses on-demand or slot-based compute. These differences affect connection configuration, query execution, and cost accounting in Laravel.

## Connection Configuration

Both packages add new database connections to `config/database.php`. Configurations include project/database, warehouse/dataset, authentication method (key file, OAuth, environment), and region.

---

# When To Use

- Laravel applications that need to read or write to Snowflake/BigQuery from Eloquent
- Migration from MySQL/PostgreSQL to cloud warehouse (can use familiar Eloquent syntax)
- Hybrid architectures: OLTP in PostgreSQL, OLAP in Snowflake/BigQuery
- Applications that use both Eloquent and raw SQL for warehouse queries
- Reporting systems that serve warehouse query results through Laravel APIs

---

# When NOT To Use

- Writing large amounts of event data (single-row INSERT is expensive in warehouses)
- Real-time ETL through Eloquent (use batch ingestion instead)
- OLTP workloads on cloud warehouses (warehouses are not designed for row-level CRUD)
- Applications where all analytics data is in ClickHouse (use ClickHouse driver)

---

# Best Practices

## Use Read-Only Database Connection

Configure the Snowflake/BigQuery connection as `read-only` in Laravel. Writes should go through batch ingestion pipelines, not Eloquent INSERT.

## Limit SELECT * Queries

`SELECT *` on wide warehouse tables is expensive. Always select only the columns needed. Eloquent's default `*` selection must be overridden with `->select()`.

## Avoid Lazy Loading

`$user->orders` triggers an Eloquent lazy load, generating a second warehouse query. Lazy loading is expensive in cloud warehouses. Use eager loading or JSON aggregation.

## Set Query Timeouts

Warehouse queries can be slow. Set appropriate timeouts: 30s for dashboard queries, 300s for report generation, 600s for ETL queries.

---

# Architecture Guidelines

## Layer Placement

The warehouse driver is an infrastructure detail. Application code should use repository or query service classes that abstract the storage backend. Switch between OLTP and OLAP connections via Laravel's multiple database connections.

## Connection Separation

Keep OLTP (PostgreSQL/MySQL) and OLAP (Snowflake/BigQuery) connections separate in `config/database.php`. Use separate model classes or traits for warehouse-backed models.

## Migration Strategy

Snowflake migrations work similarly to PostgreSQL. BigQuery migrations are limited — use the package's schema builder for supported operations and raw DDL for unsupported ones.

---

# Performance Considerations

- Cloud warehouse query latency: 100ms-10s per query (vs 1-10ms for OLTP). Not suitable for synchronous user-facing queries without caching.
- Cost per query: BigQuery charges per byte scanned. A full table scan with `SELECT *` can cost $0.10-$50+ per query.
- Snowflake credits: Warehouse must be running. Queries on a suspended warehouse auto-resume it, adding 5-30s startup time.
- Eloquent overhead for warehouse queries: minimal. The bottleneck is the warehouse execution time, not the driver.

---

# Security Considerations

- Warehouse credentials must be stored securely. Use environment variables or secret managers.
- Snowflake/BigQuery connections should use read-only roles for standard application access.
- Service account keys for BigQuery must be protected and rotated regularly.
- Enable query logging in the warehouse to audit all Laravel application queries.

---

# Common Mistakes

## Mistake: Eloquent `all()` on Large Tables

`Order::all()` in Eloquent generates `SELECT * FROM orders`. On a BigQuery table with 500M rows, this scans 500M rows and costs hundreds of dollars.

**Better approach:** Always add WHERE clauses, LIMIT, and explicit column selection for warehouse queries.

## Mistake: Single-Row INSERTs in Loops

```php
foreach ($rows as $row) {
    WarehouseOrder::create($row);
}
```
Each INSERT is a separate warehouse query. 10,000 INSERTs cost $5+ and take 30+ minutes.

**Better approach:** Use batch INSERT or the warehouse's bulk ingestion API.

## Mistake: Auto-Resume on Every Request

A Snowflake warehouse is set to auto-suspend. Every web request auto-resumes it, adding 10-30s latency to the first query.

**Better approach:** Keep the warehouse running during business hours. Use a multi-cluster warehouse for concurrent queries.

---

# Anti-Patterns

## Using Warehouse for OLTP
Treating Snowflake/BigQuery like a MySQL database. Running thousands of single-row INSERTs, UPDATEs, and DELETEs. Performance is terrible and costs are astronomical.

**Solution:** Use OLTP databases for transactional workloads. Bulk-load data into warehouses through their ingestion pipelines.

## No Caching Layer
Every dashboard query hits the warehouse directly. A dashboard with 10 widgets generates 10 warehouse queries per page load. Each query takes 2-10 seconds. Page load time is 30-60 seconds.

**Solution:** Implement a caching layer (Redis, materialized views) between the application and the warehouse. Cache dashboard results for minutes to hours.

## Ignoring Partitioning
Queries against warehouse tables without filtering on partition columns. Every query scans the full table instead of the relevant partition.

**Solution:** Design warehouse tables with appropriate partition keys. Always include partition filters in WHERE clauses.

## Using Eloquent Relationships Across Connections
Defining a `belongsTo` relationship from a Snowflake model to a PostgreSQL model. Eloquent lazy-loads the relationship in a separate query, but each query runs on different connections. This is not supported.

**Solution:** Handle cross-connection data joining in application code: query the warehouse, then batch-query PostgreSQL for related data.
