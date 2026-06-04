# Decision Trees: ClickHouse Projections vs Materialized Views

## Decision: Mechanism Selection

**Q: Does the transformation involve JOINs or subqueries?**
- Yes → Materialized View (projections do not support JOINs)
- No → Projection or MV (choose based on complexity)

**Q: Is real-time consistency required?**
- Yes → Projection (synchronous, inline)
- No → Any mechanism
- Refreshable acceptable → Refreshable MV (simplest, lowest cost)

**Q: What is the INSERT throughput?**
- < 10K/sec → Projections are fine
- 10K-100K/sec → Limit to 1-2 projections
- > 100K/sec → MVs with batching preferred over projections
