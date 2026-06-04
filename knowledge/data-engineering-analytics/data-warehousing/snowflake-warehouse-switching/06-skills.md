# Skills: Snowflake Data Sharing, Warehouse/Role Switching in Eloquent

## Skill: Implementing Warehouse Switching for Cost Optimization
**Purpose:** Route Snowflake queries to appropriate warehouses based on workload type.
**When to use:** Optimizing Snowflake compute costs by matching warehouse size to query complexity.
**Steps:**
1. Create Snowflake warehouses per workload: small (dashboards), medium (reports), large (ETL)
2. Configure auto-suspend and auto-resume per warehouse
3. Configure multiple Snowflake connections in Laravel, one per warehouse
4. Implement `WarehouseRouter` service to select warehouse based on query type
5. Route dashboard queries to small warehouse, reports to medium, ETL to large
6. Monitor credit usage per warehouse
7. Optimize warehouse sizing based on usage patterns

## Skill: Multi-Tenant Snowflake with Role Switching
**Purpose:** Use Snowflake roles for tenant isolation in a multi-tenant analytics setup.
**When to use:** Running tenant-isolated analytics on Snowflake from a single Laravel application.
**Steps:**
1. Create Snowflake roles per tenant or tenant tier
2. Grant role-specific access to databases/schemas/views
3. Configure Laravel to switch Snowflake role after connecting
4. Implement tenant resolution middleware that sets the role
5. Verify tenant isolation with query tests
6. Monitor role usage for security auditing
