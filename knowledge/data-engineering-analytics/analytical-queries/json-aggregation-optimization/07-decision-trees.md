# Decision Trees: JSON Aggregation Query Optimization

## Decision: JSON Aggregation vs Eloquent with()

**Q: How many parent records are being loaded?**
- < 50 → Eloquent `with()` (simpler, model hydration)
- 50-1,000 → Benchmark both approaches
- > 1,000 → JSON aggregation (fewer round trips, less data transfer)

**Q: Are Eloquent models needed for the response (e.g., API Resources)?**
- Yes → Eloquent `with()` with `Resource::collection()`
- No → JSON aggregation (raw data, no model overhead)

## Decision: Database Compatibility

**Q: Which database is used?**
- PostgreSQL → `json_agg` with `json_build_object` (performant, flexible)
- MySQL → `JSON_ARRAYAGG` with `JSON_OBJECT` (available from MySQL 5.7+)
- Both → Abstract the aggregation behind a repository to switch implementations
