# Rules: Snowflake/BigQuery Eloquent Driver Setup and Migration Support

## Rule SB-01: Read-Only Warehouse Connection
Warehouse database connections MUST be configured as read-only in Laravel. Data writes must go through batch ingestion pipelines.

## Rule SB-02: No SELECT * on Warehouse
Eloquent queries on warehouse tables MUST explicitly select columns. `SELECT *` scans all columns and is expensive.

## Rule SB-03: No Lazy Loading
Eager loading MUST be used for all relationships on warehouse-backed models. Lazy loading generates additional expensive warehouse queries.

## Rule SB-04: Set Query Timeouts
Warehouse queries MUST have configured timeouts: 30s for dashboard, 300s for reports, 600s for ETL.

## Rule SB-05: No Single-Row INSERTs
Single-row INSERTs through Eloquent on warehouse tables MUST be avoided. Use batch INSERT or bulk ingestion.

## Rule SB-06: Always Filter on Partition
Warehouse queries MUST include filters on partition columns. Full table scans are prohibitively expensive.

## Rule SB-07: Cache Dashboard Queries
Dashboard queries against warehouses MUST be cached (Redis, materialized views). Uncached warehouse queries make dashboards slow and expensive.

## Rule SB-08: Separate Connections for OLTP and OLAP
OLTP and OLAP connections MUST be configured as separate database connections in Laravel. Do not use the same connection for both workloads.

## Rule SB-09: No Cross-Connection Eloquent Relationships
Eloquent relationships that span OLTP and OLAP connections MUST NOT be defined. Handle cross-connection data joining in application code.

## Rule SB-10: Monitor Query Costs
Warehouse query costs MUST be monitored. Set up cost alerts for queries that exceed expected budget.
