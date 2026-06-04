# Decision Trees: AI-Assisted OLAP Modeling with LLM-Driven Schema Optimization

## Decision: When to Run AI Optimization

**Q: Has the query workload changed significantly?**
- Yes (new dashboards, new data sources) → Run AI optimization
- No → Follow quarterly schedule

**Q: Are there known performance issues?**
- Yes (slow queries, high resource usage) → Run AI optimization focused on problem area
- No → Follow regular schedule

## Decision: Recommendation Scope

**Q: What is the primary optimization goal?**
- Query performance → ORDER BY, materialized views, projections
- Storage cost → Codec selection, partition strategy, TTL policies
- Both → Full schema optimization cycle

## Decision: Apply vs Defer

**Q: Does the recommendation require table recreation?**
- Yes → Defer to maintenance window (requires downtime or zero-downtime migration)
- No → Apply during normal operations (codec change, index addition)
