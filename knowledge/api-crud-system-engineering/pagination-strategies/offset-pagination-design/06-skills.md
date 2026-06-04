# Skill: Implement Offset Pagination with Standard Page Number and Limit
## Purpose
Use offset-based pagination (`page` and `per_page` parameters) with `LIMIT` and `OFFSET` in SQL, providing predictable page numbers for user-facing navigation where page jumping is required.
## When To Use
Search results pages (users expect "go to page 5"); admin panels with page-number navigation; small to medium datasets (<100k records); APIs where total count is required.
## When NOT To Use
Large datasets with deep page access (offset slowness); real-time feeds (insertion instability); infinite scroll UIs (use cursor).
## Prerequisites
SQL `LIMIT`/`OFFSET` understanding; Pagination Parameter Validation; database indexing.
## Inputs
`page` parameter (default 1); `per_page` parameter (default 15-25); total record count (optional).
## Workflow
1. Calculate offset = (page - 1) * per_page
2. Build query: `SELECT * FROM table ORDER BY id LIMIT per_page OFFSET offset`
3. Ensure ORDER BY column is indexed for consistent ordering
4. Optionally fetch total count with `SELECT COUNT(*) FROM table` (same WHERE filters)
5. Calculate `last_page = ceil(total / per_page)`
6. Return paginated data with `current_page`, `per_page`, `last_page`, `total` in meta
7. Return `links` with `first`, `last`, `prev`, `next` URLs
8. Validate offset does not exceed integer bounds
## Validation Checklist
- [ ] `page` defaults to 1; `per_page` defaults to configured value (15-25)
- [ ] `per_page` has a configured maximum (100 max recommended)
- [ ] ORDER BY column is indexed for consistent page ordering
- [ ] Offset calculation handles page=1 correctly (offset=0)
- [ ] `last_page` calculation uses `ceil(total / per_page)`
- [ ] Empty result set returns `total: 0`, `last_page: 1`, `data: []`
- [ ] Negative or zero page numbers return validation errors
- [ ] `prev` is null on first page; `next` is null on last page
- [ ] Deep pages (page > total_pages) return empty data or 404
## Common Failures
- No bound on `per_page` — DoS via massive offset calculation
- Missing ORDER BY — inconsistent ordering between pages (records shift pages)
- Deep offset performance degradation on large datasets
- `last_page = 0` when total is 0 (should be 1 for empty results)
- Not validating page parameter — negative pages cause SQL errors
## Decision Points
- Page-based vs cursor-based offset (page-based for user-facing navigation)
- Total count with exact COUNT vs approximate count for very large tables
- Null vs empty array for data on out-of-range pages
## Performance/Security Considerations
Offset pagination degrades linearly with page depth — MySQL scans all skipped rows. Use cursor pagination for deep pages. Security: validate page/per_page as integers with bounds; prevent DoS via zero or negative offset.
## Related Rules/Skills
Offset Pagination Performance; Pagination Parameter Validation; Total Count Performance; Pagination Metadata Design.
## Success Criteria
Offset pagination returns correct slices for any valid page; meta includes all required pagination fields; validation rejects invalid page/per_page values; behavior is correct at edges (first, last, empty, out-of-range).
