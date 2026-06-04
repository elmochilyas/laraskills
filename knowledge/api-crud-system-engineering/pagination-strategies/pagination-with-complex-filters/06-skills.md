# Skill: Apply Filters on Paginated Queries Before Pagination Applies
## Purpose
Apply WHERE filters (search, status, date range) to paginated queries *before* the pagination LIMIT/OFFSET/cursor is applied, ensuring filter predicates narrow the result set and page slices reflect the filtered dataset.
## When To Use
Any paginated endpoint with filterable fields; search endpoints that combine `q` parameter with status/date filters; admin list endpoints with advanced filtering.
## When NOT To Use
Unfiltered paginated endpoints; client-side filtering (all data already fetched).
## Prerequisites
Offset Pagination Design; Cursor Pagination Design; Query Builder scopes.
## Inputs
Filter parameters (status, search, date_from, date_to, etc.); query builder instance; pagination parameters.
## Workflow
1. Start with base query (e.g., `Post::query()`)
2. Apply filters conditionally using `when()` or if-blocks — all before pagination methods
3. For search, use `where LIKE` with proper escaping or full-text search
4. For status filters, use `whereIn` with validated allowed values
5. For date ranges, use `whereBetween` or `whereDate` comparisons
6. After all filters are applied, call `->paginate()` or `->cursorPaginate()`
7. Ensure filter columns are indexed for reasonable query performance
8. Validate all filter parameters before they reach the query builder
## Validation Checklist
- [ ] Filters are applied before pagination — never after
- [ ] Search terms are escaped or use parameterized queries (prevent SQL injection)
- [ ] Filter columns are validated against an allowed whitelist
- [ ] Date range filters have validated format and logical bounds (from <= to)
- [ ] Boolean/status filters use strict type comparison
- [ ] `per_page` has a cap to prevent massive filtered result sets
- [ ] Filtered pagination is tested with known data (correct filtering + correct pagination)
- [ ] Indexes exist on the most commonly filtered column combinations
## Common Failures
- Applying filters after pagination — page 1 is correct but filtered set is wrong
- Search terms not escaped — SQL injection or broken queries with special chars
- Filtering on unindexed columns — slow queries even on small pages
- Date range without upper bound — accidentally scans all past/future records
- Combining many filters without composite indexes — query planner can't optimize
## Decision Points
- Query Builder scopes vs conditional `->when()` calls
- Full-text search (MySQL FULLTEXT, PostgreSQL tsvector) vs LIKE for search
- Filter parameter validation: Form Request vs middleware
## Performance/Security Considerations
Filtered queries benefit from composite indexes on (filter_column, sort_column). Use `EXPLAIN` to verify index usage. Security: validate filter parameters against whitelist to prevent SQL injection; escape search terms.
## Related Rules/Skills
Offset Pagination Design; Cursor Pagination Design; Input Validation; Query Builder Scopes; Database Indexing Strategy.
## Success Criteria
Filters narrow the result set before pagination; parameterized queries prevent injection; commonly filtered columns are indexed; pagination metadata reflects the filtered total.
