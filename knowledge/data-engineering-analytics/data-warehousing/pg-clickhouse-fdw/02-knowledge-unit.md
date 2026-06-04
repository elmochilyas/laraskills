# PostgreSQL ClickHouse FDW

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 04-data-warehousing
- **Knowledge Unit:** pg-clickhouse-fdw
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

`pg_clickhouse` is a PostgreSQL Foreign Data Wrapper (FDW) that enables querying ClickHouse tables directly from PostgreSQL as if they were local tables — eliminating the need for a separate ClickHouse driver in Laravel applications. PostgreSQL becomes a universal query interface where OLTP queries go to local tables and OLAP queries go to ClickHouse via FDW, all through the same database connection.

---

## Core Concepts

- **Foreign Data Wrapper (FDW):** PostgreSQL extension allowing queries against external data sources as if they were local tables — defines a foreign table with PostgreSQL schema mapping to an external table
- **Pushdown:** Mechanism by which the FDW sends query predicates (WHERE, JOIN, aggregation) to the remote data source — ensures filtering and aggregation happen in ClickHouse, not PostgreSQL — only reduced result set transferred
- **Transparent Querying:** Application code does not know it's querying a foreign table — Eloquent models can be backed by foreign tables with minimal configuration
- **Schema Mapping:** FDW maps ClickHouse column types to PostgreSQL types — not all ClickHouse types have direct PostgreSQL equivalents — type mapping must be verified

---

## Mental Models

- **FDW as Universal Translator:** PostgreSQL speaks PostgreSQL (English). ClickHouse speaks ClickHouse SQL (French). The FDW is a translator that makes ClickHouse tables appear to speak PostgreSQL. The application only ever hears one language.
- **Single Pane of Glass:** Imagine your database as a desk with two drawers — one labeled "OLTP" (PostgreSQL) and one labeled "OLAP" (ClickHouse). The FDW is like having both drawers labeled the same way so you can reach into either without thinking about which drawer you're opening.

---

## Internal Mechanics

The FDW works as a PostgreSQL extension that implements the foreign data wrapper interface. When a query targets a foreign table, PostgreSQL's query planner analyzes the query and sends the relevant portions (WHERE clauses, aggregations, LIMIT) to the ClickHouse FDW. The FDW translates PostgreSQL SQL to ClickHouse SQL, sends it over ClickHouse's HTTP interface, receives the results, and presents them as PostgreSQL rows. The `EXPLAIN (VERBOSE)` command shows which predicates were pushed down — queries without pushdown transfer entire tables before filtering.

---

## Patterns

- **Separate Analytics Schema:** Create a dedicated PostgreSQL schema for analytics foreign tables (e.g., `analytics`) — keeps OLTP and OLAP tables organized and allows schema-level permission management
- **Materialized Views for Frequent Queries:** Wrap foreign tables in PostgreSQL materialized views for dashboards querying the same aggregations every minute — refresh periodically instead of hitting ClickHouse on every load
- **Set Statement Timeout:** Configure `statement_timeout` for foreign table queries — analytics queries can be long-running, runaway ClickHouse queries should not block PostgreSQL connection pool

---

## Architectural Decisions

Use FDW when the Laravel application already uses PostgreSQL — the FDW eliminates dual connection management. Ensure the FDW connection uses a read-only ClickHouse user — writes should go through the ClickHouse ingestion pipeline. Do not use FDW for real-time streaming or for applications where ClickHouse is the primary database. Verify pushdown with `EXPLAIN (VERBOSE)` for all critical queries.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Single database connection for Laravel | FDW adds 1-10ms overhead per query | Minimal for most analytics queries |
| Eloquent models on ClickHouse tables | Limited JOIN pushdown | Complex JOINs may transfer intermediate data |
| Transparent query routing | Must verify pushdown effectiveness | Full table scan through FDW is very slow |
| Read-only FDW prevents analytics corruption | Writes require separate ClickHouse pipeline | Clear separation of read/write paths |

---

## Performance Considerations

FDW adds 1-10ms overhead per query for planning and result marshaling. Pushdown effectiveness determines query performance — a full-table scan through FDW is very slow. ClickHouse aggregation pushdown is supported — aggregations run in ClickHouse, not PostgreSQL. JOIN pushdown is limited — complex JOINs may transfer intermediate data to PostgreSQL. Network latency between PostgreSQL and ClickHouse directly impacts query time.

---

## Production Considerations

FDW connection uses a ClickHouse user — this user should have read-only access to analytics tables. PostgreSQL row-level security is preserved for foreign tables — RLS policies apply to FDW queries. FDW user credentials are stored in PostgreSQL — protect the `user_mapping` table. Never grant write access to foreign tables through the FDW.

---

## Common Mistakes

- **No Pushdown Verification:** A dashboard query with `WHERE date = today()` transfers all rows from ClickHouse to PostgreSQL and filters there — 30 seconds instead of 1 second. Better: use `EXPLAIN (VERBOSE)` to verify pushdown.
- **General-Purpose Queries Through FDW:** Using FDW for ad-hoc analytics queries scanning large portions — each query transfers millions of rows. Better: use FDW for targeted filtered queries, direct ClickHouse for large scans.
- **Complex JOINs Through FDW:** JOINing two large foreign tables — both tables fully transferred to PostgreSQL for the JOIN. Better: pre-join data in ClickHouse materialized views.

---

## Failure Modes

- **FDW as Primary ClickHouse Interface:** All queries through FDW including large ETL — PostgreSQL becomes bottleneck, ClickHouse parallel queries not utilized. Mitigation: FDW for targeted queries, direct ClickHouse for ETL.
- **Write Access Through FDW:** FDW granted INSERT on ClickHouse tables — application bugs or SQL injection can corrupt analytics data. Mitigation: FDW should be read-only.
- **Ignoring Type Mapping Issues:** ClickHouse DateTime64 with microsecond precision mapped to PostgreSQL timestamp(0) — microsecond precision silently lost. Mitigation: verify type mappings for all foreign table columns.

---

## Ecosystem Usage

The `pg_clickhouse` FDW is a PostgreSQL extension, not a Laravel package. The Laravel application connects to PostgreSQL as usual and queries foreign tables through standard Eloquent or DB facade methods. No special Laravel configuration is needed beyond the PostgreSQL connection. The FDW must be installed on the PostgreSQL server, not the Laravel application server.

---

## Related Knowledge Units

### Prerequisites
- ClickHouse MergeTree — ClickHouse table structure mapped by FDW
- PostgreSQL Fundamentals — FDW extension installation and management

### Related Topics
- ClickHouse Driver Tradeoffs — Compare FDW approach vs direct ClickHouse drivers
- Snowflake/BigQuery Drivers — Alternative cloud warehouse integration approaches

### Advanced Follow-up Topics
- ClickHouse Codecs — Column compression for efficient FDW data transfer
- Multi-Region ClickHouse — FDW query routing in distributed setups

---

## Research Notes

The `pg_clickhouse` FDW dramatically simplifies Laravel application architecture by eliminating the need for a separate ClickHouse PHP driver. The key to successful FDW usage is verifying pushdown — queries that don't push WHERE clauses and aggregations to ClickHouse perform poorly. The FDW is best suited for targeted application queries and dashboard aggregations, not for bulk ETL operations.
