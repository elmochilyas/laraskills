# Anti-Patterns: Snowflake Data Sharing, Warehouse/Role Switching in Eloquent

## Single Warehouse for All Workloads
Dashboard queries, ETL jobs, and ad-hoc analyses all run on the same X-Large warehouse. The warehouse is over-provisioned for simple queries (16x cost) and under-provisioned for complex ETL (which benefits from even larger warehouses).

**Solution:** Create dedicated warehouses per workload type. Small for dashboards, large for ETL. Match compute to task.

## No Auto-Suspend on Interactive Warehouses
The dashboard warehouse is configured with auto-suspend = 60 minutes. Even when no users are active (nights, weekends), the warehouse stays running and accruing credits.

**Solution:** Set auto-suspend to 1 minute for interactive warehouses. The resume time (5-10s) is acceptable for the first query of the day.

## Warehouse Switching Per Eloquent Query
Application code calls `setWarehouse('small')` before every SELECT and `setWarehouse('large')` before every INSERT. Each switch sends an ALTER SESSION command and incurs overhead.

**Solution:** Group operations by warehouse. Execute all SELECT queries first, then all INSERT/UPDATE queries.

## Ignoring Resource Monitors
Multiple tenants share a warehouse without resource monitors. One tenant's runaway query consumes all warehouse resources, starving other tenants' queries.

**Solution:** Configure resource monitors per warehouse. Set limits on credit usage per hour/day/week. Alert when approaching limits.

## Role Switching Without Verification
The application switches to a higher-privilege role for a query, then fails to switch back. Subsequent queries run with elevated privileges, potentially exposing data.

**Solution:** Always switch back to the default role after executing higher-privilege queries. Use try/finally blocks or middleware to ensure role restoration.
