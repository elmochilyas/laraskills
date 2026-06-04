# Decision Trees: dbt Project Structure for Medallion Architecture with Tests

## Decision: Materialization Strategy

**Q: Is the model directly consumed by BI tools?**
- Yes → Table or incremental (marts layer)
- No → Proceed to next question

**Q: Is the model used by multiple downstream models?**
- Yes → Table materialization (intermediate layer)
- No → View or ephemeral (staging, single-use intermediate)

**Q: Does the model data change?**
- Append-only → Incremental (append strategy)
- Updates → Incremental (merge strategy) or full refresh for small tables
- Static → Table materialization (run once)

## Decision: Directory Organization

**Q: How many domain areas exist?**
- 1-3 → Simple directory structure per layer
- 4-10 → Domain subdirectories within each layer
- 10+ → Consider separate dbt projects per domain

## Decision: Source Freshness Severity

**Q: How critical is the data freshness?**
- Real-time dashboards → Alert on any delay (warn: 15 min, error: 1 hour)
- Daily reports → Warn: 1 hour, error: 6 hours
- Weekly reports → Warn: 1 day, error: 2 days
