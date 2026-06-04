# Skill: Optimize Total Count Queries for Large Paginated Datasets
## Purpose
Improve `COUNT(*)` query performance on large paginated datasets — using approximate counts, cached counts, or index-only scans — to prevent total-count queries from dominating response time.
## When To Use
Offset pagination on tables >100k records; when `COUNT(*)` dominates total response time (>50ms); admin dashboards with large filtered datasets.
## When NOT To Use
Small tables (<10k records) where count is fast; cursor pagination (no total needed); unfiltered pagination with indexed primary key count.
## Prerequisites
Offset Pagination Design; MySQL/PostgreSQL query planning; database statistics.
## Inputs
Table size; current `COUNT` query execution time; filtering frequency and filter selectivity.
## Workflow
1. Profile the total count query with `EXPLAIN` — measure `rows` scanned
2. For filtered counts, ensure covering index exists for the WHERE clause
3. Consider approximate count using `EXPLAIN` rows estimate (for non-critical counts)
4. For dashboards, cache the total count with periodic refresh (TTL)
5. For high-frequency queries, use table statistics (SHOW TABLE STATUS rows estimate)
6. For filtered counts with low selectivity, use parallel count + data queries
7. Document when total count is approximate vs exact
8. Add `X-Total-Count` header or `meta.total` with source annotation
## Validation Checklist
- [ ] `COUNT(*)` query is profiled — `rows` scanned is acceptable
- [ ] Filtered counts have covering indexes for the WHERE clause
- [ ] Approximate counts are documented as approximate in API docs
- [ ] Cached counts have appropriate TTL and invalidation strategy
- [ ] Dashboard count refresh is decoupled from API response (async refresh)
- [ ] API response documents whether `total` is exact or approximate
- [ ] Fallback to exact count is available when precision is required
## Common Failures
- `COUNT(*)` on unindexed large table — full table scan for every paginated request
- Cached count serves stale data — client sees wrong last_page
- Approximate count without documentation — client relies on precision
- Filter column without index — filtered count scans full table
- Parallel count + data query doubles connection pool usage
## Decision Points
- Exact count vs approximate count per endpoint (precision vs speed)
- Cache count with short TTL vs long TTL + manual refresh
- `COUNT(*)` vs `COUNT(id)` vs `EXPLAIN` rows estimate
## Performance/Security Considerations
Approximate counts eliminate table scans entirely. Cache invalidation must handle concurrent writes. Security: no direct impact, but slow counts enable DoS; rate-limit paginated endpoints that trigger count queries.
## Related Rules/Skills
Offset Pagination Performance; Offset Pagination Design; Cache Strategy; Database Indexing.
## Success Criteria
Total count query time is under 50ms; approximate counts are documented; cached counts have appropriate TTL; fallback to exact count exists when needed.
