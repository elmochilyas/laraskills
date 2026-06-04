# Decision Trees: Snowflake Data Sharing, Warehouse/Role Switching in Eloquent

## Decision: Warehouse Size Selection

**Q: What type of query?**
- Dashboard (simple aggregations, filtered) → X-Small or Small
- Report (medium complexity, multiple joins) → Small or Medium
- ETL / Backfill (full table scans, complex) → Large or X-Large
- Ad-hoc exploration → Medium

**Q: What is the expected concurrency?**
- < 5 concurrent users → Single-cluster warehouse
- 5-50 concurrent → Multi-cluster (2-5 clusters)
- 50+ concurrent → Multi-cluster (5-10 clusters) or separate warehouses

## Decision: Role Switching Need

**Q: Is tenant isolation required?**
- Yes → Role switching per tenant or tenant group
- No → Single application role

**Q: Are there different data access levels?**
- Yes (admin, analyst, viewer) → Role per access level
- No → Single role for all queries
