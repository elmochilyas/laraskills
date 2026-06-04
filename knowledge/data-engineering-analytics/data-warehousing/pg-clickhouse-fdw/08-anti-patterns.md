# Anti-Patterns: pg_clickhouse FDW for Transparent Analytical Query Pushdown

## FDW for ETL Operations
Running large INSERT INTO ... SELECT FROM foreign_table through the FDW. Every row passes through PostgreSQL's query executor, adding overhead and limiting throughput to PostgreSQL's connection pool.

**Solution:** Use ClickHouse's native client or HTTP API for ETL. FDW is for application queries, not data movement.

## Write Access Through FDW
The FDW user has INSERT permission on ClickHouse tables. Application code writes analytics events through the FDW, bypassing the ingestion pipeline's validation and enrichment logic.

**Solution:** FDW must be read-only. Analytics ingestion goes through dedicated middleware → queue → ClickHouse path.

## No Pushdown Monitoring
Queries against foreign tables are slow but no one checks EXPLAIN plans. Each query transfers the entire ClickHouse table to PostgreSQL before filtering.

**Solution:** Monitor slow query logs for foreign table queries. Verify pushdown during development and after schema changes.

## Complex JOINs Between Multiple Foreign Tables
JOINing 3 foreign tables through FDW. ClickHouse's limited JOIN pushdown means PostgreSQL pulls all 3 tables locally and performs the join in memory.

**Solution:** Create a ClickHouse materialized view that pre-joins the data. The FDW queries the single materialized view instead of multiple tables.

## Ignoring FDW Impact on PostgreSQL
The FDW runs analytics queries in the PostgreSQL session. A 30-second ClickHouse query via FDW holds a PostgreSQL connection for 30 seconds. Limited connection pool quickly exhausts.

**Solution:** Set strict statement_timeout for foreign tables. Use separate connection pool for analytics queries.
