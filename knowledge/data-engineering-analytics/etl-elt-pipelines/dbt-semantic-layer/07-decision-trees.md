# Decision Trees: dbt Semantic Layer + MetricFlow for Consistent Metrics

## Decision: When to Use the Semantic Layer

**Q: How many BI tools consume metrics?**
- 1 → Semantic Layer optional (single tool metrics may suffice)
- 2-3 → Semantic Layer recommended for consistency
- 4+ → Semantic Layer required for consistency

**Q: How often do metric definitions change?**
- Monthly or less → Direct SQL may be simpler
- Weekly → Semantic Layer reduces update overhead
- Daily → Semantic Layer essential

**Q: How many metrics are defined?**
- < 20 → Manageable manually across tools
- 20-100 → Semantic Layer significantly reduces maintenance
- 100+ → Semantic Layer required

## Decision: Metric Type

**Q: Is the metric a simple aggregation?**
- Yes → Simple metric type
- No → Proceed

**Q: Is the metric a ratio of two metrics?**
- Yes → Ratio metric
- No → Derived metric (expression)

## Decision: Cache Strategy

**Q: How often is the metric queried?**
- Every minute → Cache aggressively (TTL: 5 min)
- Every hour → Moderate caching (TTL: 1 hour)
- Daily → Minimal caching (TTL: 6 hours)
