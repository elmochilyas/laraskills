# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** pg-clickhouse-fdw
**Difficulty:** Advanced
**Category:** Database Integration
**Last Updated:** 2026-06-03

---

# Overview

`pg_clickhouse` is a PostgreSQL Foreign Data Wrapper (FDW) that enables querying ClickHouse tables directly from PostgreSQL as if they were local tables. This allows Laravel applications (which connect to PostgreSQL) to seamlessly query analytical data stored in ClickHouse without changing the database connection, writing raw SQL, or duplicating data between systems. The FDW pushdowns WHERE clauses, aggregations, and JOINs to ClickHouse — only the result set crosses the wire.

The key engineering insight is that the FDW eliminates the need for a separate ClickHouse driver in the Laravel application. PostgreSQL becomes a universal query interface: OLTP queries go to local PostgreSQL tables, OLAP queries go to ClickHouse via FDW, all through the same database connection.

Engineers must care because the FDW pattern dramatically simplifies the application architecture. No ClickHouse PHP driver, no dual connection management, no separate query builder. The Laravel application uses standard Eloquent and query builder syntax for both OLTP and OLAP queries.

---

# Core Concepts

## Foreign Data Wrapper (FDW)

A PostgreSQL extension that allows querying external data sources as if they were local tables. The FDW defines a foreign table with a PostgreSQL schema that maps to an external table (ClickHouse in this case).

## Pushdown

The mechanism by which the FDW sends query predicates (WHERE, JOIN, aggregation) to the remote data source. Pushdown ensures that filtering and aggregation happen in ClickHouse, not PostgreSQL. Only the reduced result set is transferred.

## Transparent Querying

Application code does not know it's querying a foreign table. The SQL query uses the same syntax as local table queries. Eloquent models can be backed by foreign tables with minimal configuration.

## Schema Mapping

The FDW maps ClickHouse column types to PostgreSQL types. Not all ClickHouse types have direct PostgreSQL equivalents. Type mapping must be verified for each foreign table.

---

# When To Use

- Laravel applications using PostgreSQL that need ClickHouse analytics access
- Systems where simplifying the application connection architecture is a priority
- Environments with dedicated PostgreSQL DBA support
- Applications that need transparent analytics queries through Eloquent
- Migration paths from PostgreSQL-only to ClickHouse-augmented analytics

---

# When NOT To Use

- Pure ClickHouse applications without PostgreSQL
- Applications where ClickHouse is the primary database
- Systems requiring real-time streaming (FDW adds query overhead)
- Environments where PostgreSQL FDW extension installation is blocked
- High-frequency query patterns (> 1000 queries/sec through FDW)

---

# Best Practices

## Verify Pushdown

Use `EXPLAIN (VERBOSE)` to verify that predicates are being pushed down to ClickHouse. A query without pushdown transfers the entire table from ClickHouse to PostgreSQL before filtering.

## Use Materialized Views for Frequent Queries

Wrap foreign tables in PostgreSQL materialized views for dashboards that query the same aggregations every minute. Refresh the materialized view periodically instead of hitting ClickHouse on every dashboard load.

## Set Statement Timeout

Configure `statement_timeout` for foreign table queries. Analytics queries can be long-running. A runaway ClickHouse query should not block the PostgreSQL connection pool.

## Monitor FDW Performance

Track `pg_stat_user_fdw` and slow query logs for foreign table queries. Identify queries that are not pushing down predicates.

---

# Architecture Guidelines

## Data Flow

Laravel → PostgreSQL → FDW → ClickHouse → FDW → PostgreSQL → Laravel

The application queries PostgreSQL. If the query targets a foreign table, PostgreSQL forwards it to ClickHouse, receives the result, and returns it to the application.

## Schema Design

Create a separate PostgreSQL schema for analytics foreign tables (e.g., `analytics`). This keeps OLTP and OLAP tables organized and allows schema-level permission management.

## Connection Management

The FDW connects to ClickHouse using the HTTP interface. Configure connection pooling at the PostgreSQL level to reuse ClickHouse connections.

---

# Performance Considerations

- FDW adds 1-10ms overhead per query for query planning and result marshaling.
- Pushdown effectiveness determines query performance. A full-table scan through FDW is slow.
- ClickHouse aggregation pushdown is supported: aggregations run in ClickHouse, not PostgreSQL.
- JOIN pushdown is limited. Complex JOINs may transfer intermediate data to PostgreSQL.
- Network latency between PostgreSQL and ClickHouse directly impacts query time.

---

# Security Considerations

- The FDW connection to ClickHouse uses a ClickHouse user. This user should have read-only access to analytics tables.
- PostgreSQL row-level security is preserved for foreign tables. RLS policies apply to FDW queries.
- FDW user credentials are stored in PostgreSQL. Protect the `user_mapping` table.
- Never grant write access to foreign tables through the FDW. Writes should go through the ClickHouse ingestion pipeline.

---

# Common Mistakes

## Mistake: No Pushdown Verification

A dashboard query with `WHERE date = today()` transfers all rows from ClickHouse to PostgreSQL and filters there. Query takes 30 seconds instead of 1 second.

**Better approach:** Use `EXPLAIN (VERBOSE)` to verify pushdown. Structure queries to maximize predicate pushdown.

## Mistake: General-Purpose Queries Through FDW

Using the FDW for ad-hoc analytics queries that scan large portions of the ClickHouse table. Each query transfers millions of rows from ClickHouse to PostgreSQL.

**Better approach:** Use FDW for targeted, filtered queries. Use direct ClickHouse access for large scans or aggregations.

## Mistake: Complex JOINs Through FDW

JOINing two large foreign tables through the FDW. Both tables are fully transferred to PostgreSQL for the JOIN operation.

**Better approach:** Pre-join data in ClickHouse materialized views or use ClickHouse's JOIN capabilities through the FDW's pushdown.

---

# Anti-Patterns

## FDW as Primary ClickHouse Interface
All ClickHouse queries go through the FDW, including large ETL operations and full-table scans. PostgreSQL becomes a bottleneck, and ClickHouse's parallel query capabilities are not fully utilized.

**Solution:** Use FDW for targeted application queries. Use direct ClickHouse connections for ETL and large analytical workloads.

## Write Access Through FDW
The FDW is granted INSERT/UPDATE permissions on ClickHouse tables. Application bugs or SQL injection through PostgreSQL can corrupt analytics data.

**Solution:** FDW should be read-only. Analytics data ingestion goes through ClickHouse's native INSERT path.

## Ignoring Type Mapping Issues
A ClickHouse DateTime64 with microsecond precision is mapped to PostgreSQL timestamp(0). Microsecond precision is silently lost without warning.

**Solution:** Verify type mappings for all foreign table columns. Configure explicit type casting where needed.

## No Monitoring
FDW query performance is not monitored. A schema change in ClickHouse breaks the foreign table mapping, and no one notices until dashboard queries fail.

**Solution:** Monitor `pg_stat_user_fdw` for query counts, timing, and errors. Set up alerts for foreign table failures.
