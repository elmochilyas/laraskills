# Decision Trees: Snowflake/BigQuery Eloquent Driver Setup and Migration Support

## Decision: Warehouse Selection

**Q: What is the primary analytics workload?**
- Ad-hoc queries, exploration → BigQuery (on-demand pricing, fast startup)
- Predictable reporting → Snowflake (warehouse sizing, consistent performance)
- Mixed → Both; use each for its strengths

**Q: Does the budget support warehouse compute?**
- Low / Variable → BigQuery (pay per byte scanned)
- Medium / Predictable → Snowflake (warehouse credits)
- High / Enterprise → Either; choose based on feature needs

## Decision: Query Pattern

**Q: Is the query for a user-facing dashboard?**
- Yes → Cache aggressively (TTL: 60-300s), use pre-aggregated tables
- No → Direct warehouse query acceptable

**Q: How much data does the query scan?**
- < 1 GB → Direct Eloquent query is fine
- 1 GB - 100 GB → Optimize: partition filter, select only needed columns
- > 100 GB → Use pre-aggregated tables or materialized views
