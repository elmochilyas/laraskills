# Rules: Snowflake Data Sharing, Warehouse/Role Switching in Eloquent

## Rule SW-01: Warehouse Per Workload
Snowflake warehouses MUST be created per workload type: small for dashboards, medium for reports, large for ETL. A single warehouse for all workloads is cost-inefficient.

## Rule SW-02: Auto-Suspend Configured
All warehouses MUST have auto-suspend configured. Interactive: 1 minute. ETL: 5-10 minutes. No warehouse should run 24/7 without active queries.

## Rule SW-03: Group Queries by Warehouse
Queries MUST be grouped by type and executed on the appropriate warehouse. Switching warehouses per query adds connection overhead.

## Rule SW-04: Pre-Warm for Scheduled Workloads
Warehouses used for scheduled ETL/backfill jobs MUST be pre-warmed before job execution. Warehouse resume time adds 10-30s to job start.

## Rule SW-05: Connection Pooling
Warehouse connections MUST be reused via connection pooling. Creating a new connection per query exhausts Snowflake connection limits.

## Rule SW-06: Role-Based Access
Role switching MUST enforce tenant isolation and access control. A warehouse switch must not bypass role permissions.

## Rule SW-07: Monitor Warehouse Usage
Warehouse credit usage MUST be monitored per workload. Cost attribution by warehouse enables optimization targeting.

## Rule SW-08: No Cross-Warehouse Data Access
Warehouse switching MUST NOT imply cross-warehouse data access. All warehouses access the same shared storage layer.

## Rule SW-09: Resource Monitors for Shared Warehouses
Shared warehouses MUST have resource monitors to prevent one tenant/workload from consuming all warehouse resources.

## Rule SW-10: Test Warehouse Switching
Warehouse switching logic MUST be tested: verify correct warehouse is used for each query type, verify performance characteristics, verify cost attribution.
