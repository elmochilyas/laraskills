# Rules: pg_clickhouse FDW for Transparent Analytical Query Pushdown

## Rule FDW-01: Read-Only FDW
The FDW connection to ClickHouse MUST use a read-only ClickHouse user. All data writes must go through the ClickHouse ingestion pipeline.

## Rule FDW-02: Verify Pushdown
Every foreign table query MUST have pushdown verified using `EXPLAIN (VERBOSE)`. Queries without pushdown defeat the purpose of the FDW.

## Rule FDW-03: Statement Timeout
Foreign table queries MUST have `statement_timeout` configured. Long-running ClickHouse queries must not block PostgreSQL connection pools.

## Rule FDW-04: Separate Schema for Foreign Tables
ClickHouse foreign tables MUST be created in a dedicated PostgreSQL schema (e.g., `analytics`). This separates OLTP and OLAP table management.

## Rule FDW-05: Avoid Complex JOINs Through FDW
JOINs between foreign tables SHOULD be avoided. Pre-join data in ClickHouse materialized views instead of relying on PostgreSQL JOIN execution.

## Rule FDW-06: Monitor Foreign Table Performance
`pg_stat_user_fdw` MUST be monitored for query timing, row counts, and errors. Foreign table performance issues are invisible without monitoring.

## Rule FDW-07: Materialized Views for Frequent Queries
Dashboard queries that run more than once per minute SHOULD use PostgreSQL materialized views with periodic refresh instead of hitting ClickHouse through FDW.

## Rule FDW-08: Type Mapping Verification
Column type mappings between ClickHouse and PostgreSQL MUST be verified for every foreign table. Silent precision loss is not acceptable.

## Rule FDW-09: Protect FDW Credentials
FDW user credentials in PostgreSQL `user_mapping` MUST be protected. Credential exposure provides ClickHouse read access.

## Rule FDW-10: No ETL Through FDW
ETL operations and large data movements MUST NOT go through the FDW. Use direct ClickHouse connections for bulk data operations.
