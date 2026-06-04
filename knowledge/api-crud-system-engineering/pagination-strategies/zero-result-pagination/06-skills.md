# Skill: Handle Zero-Result Paginated Responses Correctly
## Purpose
Return correct pagination metadata when a query returns zero results — empty `data` array, `total: 0`, `last_page: 1`, and `null` prev/next links — without errors or misleading pagination state.
## When To Use
Every paginated endpoint; search/filter endpoints that may match nothing; new resources with no records yet.
## When NOT To Use
Non-paginated responses (empty array is fine); pagination of required data that always exists.
## Prerequisites
Offset Pagination Design; Pagination Metadata Design.
## Inputs
Empty query result; pagination parameters (page, per_page).
## Workflow
1. Query returns no matching records
2. `total` is returned as `0` in the meta
3. `last_page` is returned as `1` (because `ceil(0 / per_page)` would be 0 — correct to 1)
4. `current_page` matches the requested page
5. `per_page` matches the requested per_page
6. `data` is an empty array `[]`, not `null`
7. `first` link points to page 1
8. `last` link points to page 1
9. `prev` is `null`
10. `next` is `null`
11. HTTP status is `200 OK` (not 404)
## Validation Checklist
- [ ] `data` is `[]` (empty array), not `null` or absent
- [ ] `total` is `0`
- [ ] `last_page` is `1` (not `0`)
- [ ] `current_page` matches requested page
- [ ] `per_page` matches requested per_page
- [ ] `prev` link is `null`
- [ ] `next` link is `null`
- [ ] `first` and `last` both point to page 1
- [ ] HTTP status is 200
- [ ] Cursor pagination: `next_cursor` is `null`
## Common Failures
- `last_page: 0` — `ceil(0 / per_page)` returns 0, which is wrong
- `data: null` — JSON returns `"data": null` instead of `"data": []`
- Returning 404 for paginated endpoint with no results
- `prev`/`next` links point to page 0 or some other incorrect page
- `first` link points to the requested page (not page 1)
## Decision Points
- `last_page: 1` vs `last_page: 0` — always use 1 (one page exists, it's empty)
- `links.first` and `links.last` both pointing to page 1
- Explicit `null` prev/next vs omitting the keys
## Performance/Security Considerations
Zero-result pagination is fast (no data to process). Security: ensure zero results don't leak information about existence of filtered data (consistent response structure regardless of results).
## Related Rules/Skills
Offset Pagination Design; Cursor Pagination Design; Pagination Metadata Design; Pagination Parameter Validation.
## Success Criteria
Zero-result paginated responses are consistent with non-empty responses (same structure); meta fields use sensible defaults; HTTP status is 200; data is an empty array.
