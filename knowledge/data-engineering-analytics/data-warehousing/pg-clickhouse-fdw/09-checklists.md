# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** pg-clickhouse-fdw
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] pg_clickhouse FDW installed and configured on PostgreSQL server
- [ ] Foreign server and user mapping created for ClickHouse connection
- [ ] Foreign table defined mapping ClickHouse columns to PostgreSQL types
- [ ] WHERE pushdown verified — filters executed on ClickHouse, not PostgreSQL
- [ ] Aggregation pushdown verified — GROUP BY/SUM/COUNT executed on ClickHouse
- [ ] FDW as alternative to direct ClickHouse PHP driver evaluated (K032)

---

# Architecture Checklist

- [ ] FDW foreign server points to ClickHouse HTTP endpoint with connection pool
- [ ] User mapping created with read-only ClickHouse credentials
- [ ] Foreign table schema maps ClickHouse types to compatible PostgreSQL types
- [ ] WHERE pushdown confirmed via EXPLAIN (VERBOSE) on FDW queries
- [ ] Aggregation pushdown confirmed — ClickHouse processes GROUP BY, PostgreSQL receives aggregates
- [ ] FDW eliminates need for separate ClickHouse driver for Laravel — query through PostgreSQL connection

---

# Implementation Checklist

- [ ] PostgreSQL extension installed: CREATE EXTENSION pg_clickhouse
- [ ] Foreign server created: CREATE SERVER clickhouse_srv FOREIGN DATA WRAPPER clickhouse_fdw
- [ ] Foreign table created: CREATE FOREIGN TABLE ch_events () SERVER clickhouse_srv OPTIONS(table 'events')
- [ ] User mapping created: CREATE USER MAPPING FOR laravel_user SERVER clickhouse_srv
- [ ] Schema mapping configured if ClickHouse database differs from PostgreSQL schema
- [ ] Laravel migration adds foreign tables via raw SQL or PostgreSQL schema dump

---

# Performance Checklist

- [ ] WHERE pushdown verified for all common query patterns — no rows pulled to PostgreSQL
- [ ] Aggregation pushdown reduces data transfer — only aggregated rows cross the wire
- [ ] FDW batch_size option tuned for network round trips vs memory
- [ ] JOIN between PostgreSQL and ClickHouse tables avoided — prefer pushdown
- [ ] Connection pooling configured to avoid per-query connection overhead
- [ ] FDW query latency benchmarked against direct ClickHouse HTTP driver

---

# Security Checklist

- [ ] Foreign server user mapping with read-only ClickHouse credentials
- [ ] FDW schema visible only to authorized PostgreSQL roles
- [ ] Sensitive ClickHouse columns excluded from foreign table definition
- [ ] PostgreSQL row-level security applied on foreign tables for multi-tenancy
- [ ] ClickHouse query log audited for FDW-sourced queries

---

# Reliability Checklist

- [ ] FDW connection failure returns PostgreSQL error — application handles gracefully
- [ ] FDW timeouts configured to prevent long-running queries blocking PostgreSQL worker
- [ ] ClickHouse unavailable handled by PostgreSQL query fallback (cached data)
- [ ] FDW batch processing works with large result sets (streaming, not buffering)
- [ ] Connection pool health-check evicts stale ClickHouse connections

---

# Testing Checklist

- [ ] Test foreign table SELECT returns correct ClickHouse data in PostgreSQL
- [ ] Test WHERE pushdown via EXPLAIN (VERBOSE) — filter appears in ClickHouse remote SQL
- [ ] Test aggregation pushdown — GROUP BY sent to ClickHouse, not PostgreSQL
- [ ] Test JOIN between PostgreSQL local table and ClickHouse foreign table
- [ ] Test FDW timeout — long-running ClickHouse query returns error within timeout
- [ ] Test ClickHouse unavailable — PostgreSQL query returns graceful error

---

# Maintainability Checklist

- [ ] Foreign table DDL in version-controlled migration files
- [ ] Schema mapping documented when ClickHouse types differ from PostgreSQL
- [ ] FDW connection configuration in PostgreSQL config file (postgresql.conf)
- [ ] Pushdown test results archived for query pattern regression detection
- [ ] FDW upgrade procedure documented (pg_clickhouse extension version)

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use FDW for real-time inserts — FDW is for queries, not writes
- [ ] Do not skip EXPLAIN verification — pushdown is not automatic for all operations
- [ ] Do not JOIN PostgreSQL and ClickHouse tables without pushdown verification
- [ ] Do not expose all ClickHouse columns via FDW — select subset matching use case
- [ ] Do not use FDW as primary data ingestion path — use ETL pipeline

---

# Production Readiness Checklist

- [ ] Prometheus metrics for FDW query count, latency, and rows transferred
- [ ] Logged warning when FDW pushdown percentage drops below threshold
- [ ] Alert when ClickHouse FDW connection errors exceed threshold
- [ ] FDW query patterns documented in operations runbook
- [ ] Deploy checklist includes FDW foreign server health verification
- [ ] Staging validation confirms pushdown for all application query patterns

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: foreign server/mapping/table, WHERE and aggregation pushdown
- [ ] Security requirements satisfied: read-only credentials, schema restricted, PII columns excluded, row-level security
- [ ] Performance requirements satisfied: pushdown verified via EXPLAIN, batch size tuned, connection pooling
- [ ] Testing requirements satisfied: SELECT correctness, pushdown confirmation, JOINs, timeout, availability
- [ ] Anti-pattern checks passed: FDW for queries not writes, EXPLAIN verified, column subset selected
- [ ] Production readiness verified: pushdown metrics, connection error alerts, staging validation, runbook

---

# Related References

- K012 (ClickHouse MergeTree): ClickHouse table design queried through FDW
- K032 (ClickHouse Driver Tradeoffs): FDW as alternative to direct ClickHouse drivers
- K013 (Snowflake/BigQuery Drivers): FDW eliminates need for separate drivers
