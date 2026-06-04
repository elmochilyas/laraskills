# Decision Trees: Snowflake/BigQuery/Redshift Cost Optimization at Scale

## Decision: Optimization Priority

**Q: Which cost component dominates?**
- Compute (Snowflake credits, BigQuery bytes scanned) → Optimize queries and caching first
- Storage (TB/month) → Implement TTL and archival

**Q: Are dashboards the primary query source?**
- Yes → Cache dashboards aggressively. Use materialized views.
- No → Optimize ETL and batch processing queries.

## Decision: Query Optimization

**Q: Does the query SELECT *?**
- Yes → Reduce to required columns only
- No → Check next

**Q: Does the query filter on partition columns?**
- Yes → Verify partition pruning effectiveness
- No → Add partition column filter

## Decision: Warehouse Right-Sizing

**Q: What is the warehouse CPU utilization?**
- < 20% → Reduce warehouse size
- 20-80% → Appropriate size
- > 80% → Consider increasing size
