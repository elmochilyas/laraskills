# Rules: Snowflake/BigQuery/Redshift Cost Optimization at Scale

## Rule WC-01: Cache Before the Warehouse
All dashboard queries MUST be cached (Redis, application cache). Uncached warehouse queries on dashboards are the primary driver of excessive costs.

## Rule WC-02: Select Only Required Columns
Warehouse queries MUST explicitly select columns. SELECT * on wide warehouse tables is wasteful and expensive.

## Rule WC-03: Auto-Suspend All Warehouses
Snowflake warehouses MUST have auto-suspend enabled. Interactive: 1 minute. ETL: 5 minutes. No warehouse runs indefinitely.

## Rule WC-04: Filter on Partition
All warehouse queries MUST include filters on partition columns. Full table scans are the most expensive query pattern.

## Rule WC-05: Right-Size Warehouses
Warehouse size MUST match workload complexity. X-Small for dashboards, Large for ETL. Over-provisioning is the leading cause of Snowflake cost waste.

## Rule WC-06: Monitor Query Costs
Warehouse query costs MUST be monitored. Use Snowflake ACCOUNT_USAGE, BigQuery INFORMATION_SCHEMA, Redshift STL_QUERY.

## Rule WC-07: Materialized Views for Common Aggregations
Frequently queried aggregations MUST use materialized views. Querying raw data repeatedly for the same aggregation is wasteful.

## Rule WC-08: TTL for Raw Data
Raw event data MUST have a retention TTL. Default: 30 days raw data, 12 months aggregated, 7 years compressed archival.

## Rule WC-09: Cost Attribution Tags
Every query SHOULD be tagged with application context for cost attribution. Warehouse costs should be traceable to specific features or customers.

## Rule WC-10: Set Budget Alerts
Resource monitors (Snowflake) or budget alerts (BigQuery) MUST be configured. Automated alerts prevent surprise warehouse bills.
