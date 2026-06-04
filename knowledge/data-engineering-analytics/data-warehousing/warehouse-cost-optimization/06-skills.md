# Skills: Snowflake/BigQuery/Redshift Cost Optimization at Scale

## Skill: Monitoring and Reducing Warehouse Query Costs
**Purpose:** Identify and reduce expensive queries in cloud data warehouses.
**When to use:** Monthly cost optimization review for analytics infrastructure.
**Steps:**
1. Set up cost monitoring dashboard (Snowflake ACCOUNT_USAGE, BigQuery INFORMATION_SCHEMA)
2. Identify top 10 most expensive queries by cost
3. Analyze each query: is it cached? Does it filter on partition? Does it SELECT *?
4. Add caching for expensive queries
5. Rewrite queries to reduce scanned bytes
6. Implement materialized views for common aggregations
7. Verify cost reduction after changes

## Skill: Right-Sizing Snowflake Warehouses
**Purpose:** Match warehouse size to workload requirements for optimal cost/performance.
**When to use:** Optimizing Snowflake warehouse configuration.
**Steps:**
1. Analyze query performance per warehouse
2. Reduce warehouse size and benchmark query performance
3. Set auto-suspend based on workload patterns
4. Create workload-specific warehouses (dashboards, reports, ETL)
5. Configure multi-cluster warehouses for high-concurrency workloads
6. Monitor credit usage per warehouse after changes
