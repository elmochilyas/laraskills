# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** snowflake-bigquery-drivers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] foundry-co/laravel-snowflake or noman-sheikh/laravel-bigquery-eloquent package installed
- [ ] Eloquent connection configured for Snowflake or BigQuery in config/database.php
- [ ] Warehouse differences understood: Snowflake compute-credit billing vs BigQuery data-scanned billing
- [ ] Star schema table design applied for Snowflake/BigQuery analytical tables (K006)
- [ ] Migration support verified for schema changes against cloud warehouse
- [ ] ClickHouse evaluated as alternative warehouse (K012 integration)

---

# Architecture Checklist

- [ ] Snowflake/BigQuery connection uses dedicated read-only role for Laravel access
- [ ] Eloquent model optimized for OLAP patterns (bulk INSERT, read-only SELECT, no lazy loading)
- [ ] Connection configuration separates OLTP (MySQL) from OLAP (Snowflake/BigQuery) databases
- [ ] Warehouse switching strategy designed for cost optimization (K025 integration)
- [ ] Star schema dimensions and facts mapped to Eloquent models
- [ ] Migration files tested against warehouse compatibility (column types, indexes, partitions)

---

# Implementation Checklist

- [ ] Snowflake driver installed via Composer: foundry-co/laravel-snowflake
- [ ] BigQuery driver installed via Composer: noman-sheikh/laravel-bigquery-eloquent
- [ ] config/database.php connection added with warehouse, database, schema, role
- [ ] Eloquent model extends base model with correct connection and table name
- [ ] Migration up/down tested against warehouse — column types supported
- [ ] Factory/Seeder disabled for warehouse models (bulk insert only)

---

# Performance Checklist

- [ ] Eloquent chunk() used for large SELECT — LIMIT/OFFSET partitioned automatically
- [ ] Bulk INSERT used (insert() with array of rows), not individual Model::create()
- [ ] N+1 queries avoided — Eager loading not applicable in OLAP context
- [ ] Warehouse-specific optimizations: clustering keys (Snowflake), partitioning (BigQuery)
- [ ] Query cost estimated before execution (Snowflake EXPLAIN, BigQuery dry run)
- [ ] Lazy loading disabled for warehouse models to prevent accidental query explosion

---

# Security Checklist

- [ ] Warehouse credentials in environment config with read-only permissions
- [ ] Role-based access configured in warehouse (Laravel application role with minimal grants)
- [ ] Sensitive columns masked or excluded from warehouse access
- [ ] Network policies restrict warehouse access to application IP range
- [ ] Query audit log enabled in warehouse for security review

---

# Reliability Checklist

- [ ] Warehouse connection retry configured for transient errors (throttling, timeout)
- [ ] Migration rollback tested — warehouse schema changes are reversible
- [ ] Query timeout configured per warehouse for dashboard queries
- [ ] Warehouse auto-suspend configured for cost control (Snowflake)
- [ ] Fleet management considered if driver update breaks compatibility

---

# Testing Checklist

- [ ] Test Eloquent SELECT from warehouse returns correct data
- [ ] Test bulk INSERT with 10k+ rows completes within expected duration
- [ ] Test migration create/drop table against warehouse
- [ ] Test chunked SELECT processes large result set without memory error
- [ ] Test warehouse connection failure — application falls back to cache or error gracefully
- [ ] Test EXPLAIN plan shows pushdown of WHERE filters to warehouse

---

# Maintainability Checklist

- [ ] Warehouse connection config in single environment file with clear variable names
- [ ] Eloquent models for warehouse organized in app/Models/Analytics/ directory
- [ ] Migration files for warehouse organized in database/migrations/analytics/
- [ ] Warehouse driver upgrade tested in CI before production deployment
- [ ] Driver-specific code wrapped in conditionals or separate service class

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use Eloquent ORM for real-time OLTP writes on warehouse — use bulk INSERT
- [ ] Do not use $model->save() per row — always use batch insert()
- [ ] Do not rely on Eloquent events (saved, creating) for warehouse models
- [ ] Do not use lazy loading (relationship without eager loading) in warehouse context
- [ ] Do not treat warehouse as primary database — it is an analytical replica

---

# Production Readiness Checklist

- [ ] Prometheus metrics for warehouse query count, latency, and bytes scanned
- [ ] Logged warning when warehouse query scans > 1GB (cost alert)
- [ ] Alert when warehouse connection error rate exceeds 1%
- [ ] Warehouse cost budget alert configured per billing account
- [ ] Deploy checklist includes warehouse migration dry-run step
- [ ] Staging load test validates warehouse query patterns before production

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: OLTP/OLAP separation, warehouse models, migration compatibility
- [ ] Security requirements satisfied: read-only role, network policy, column masking, query audit
- [ ] Performance requirements satisfied: chunked SELECT, bulk INSERT, clustering/partitioning, EXPLAIN verification
- [ ] Testing requirements satisfied: SELECT correctness, bulk insert, migration, failover, memory limits
- [ ] Anti-pattern checks passed: no per-row save, no Eloquent events, no lazy loading, batch only
- [ ] Production readiness verified: query metrics, cost alerts, dry-run migrations, staging load test

---

# Related References

- K006 (Star Schema): Designing Snowflake/BigQuery tables for analytical queries
- K012 (ClickHouse MergeTree): ClickHouse as alternative data warehouse
- K025 (Snowflake Warehouse Switching): Managing multiple warehouses within Laravel
- K032 (ClickHouse Driver Tradeoffs): Driver architecture tradeoffs
