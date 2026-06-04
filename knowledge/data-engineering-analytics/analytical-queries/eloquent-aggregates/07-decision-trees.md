# Decision Trees: Eloquent withSum/withAvg/withCount and Subquery Patterns

## Decision: withCount vs Pre-Computed Counter

**Q: How many parent rows are being queried?**
- < 10,000 → `withCount` (simple, always correct)
- 10,000 - 1,000,000 → `withCount` with indexed foreign keys
- > 1,000,000 → Pre-computed counter column / materialized view

## Decision: withCount vs joinSub

**Q: Is the aggregation beyond simple COUNT/SUM (e.g., JSON aggregation, array_agg)?**
- Yes → `joinSub` with raw SQL (more flexible)
- No → `withCount` / `withSum` (simpler, readable)

## Decision: loadCount vs withCount

**Q: Is the count needed conditionally (based on parent data)?**
- Yes → `loadCount` (conditional loading after parent query)
- No → `withCount` (single query, more efficient)
