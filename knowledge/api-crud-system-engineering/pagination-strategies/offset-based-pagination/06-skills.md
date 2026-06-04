# Skill: Implement Offset-Based Pagination

## Purpose
Implement offset pagination using Laravel's `paginate()` for standard datasets with page parameter, per_page cap, links generation, and total count optimization.

## When To Use
- Datasets <10K records
- Page-number navigation required
- Admin panels and data tables with pagination controls
- Simple API consumers familiar with offset pagination

## When NOT To Use
- Large datasets (>10K records) with deep pagination
- Real-time feeds where new records shift pages
- Performance-sensitive endpoints (COUNT query overhead)

## Prerequisites
- Laravel LengthAwarePaginator
- Database indexes on sort columns

## Inputs
- Pagination configuration (default per_page, max per_page)
- Sort field specification

## Workflow
1. Use `Model::paginate($perPage)` for standard offset pagination
2. Accept `page` query parameter for page number — default to 1
3. Accept `per_page` query parameter — cap at configurable maximum (default 100)
4. Return 422 if `per_page` > max or if `page` is negative/non-numeric
5. Include pagination metadata: `current_page`, `per_page`, `total`, `last_page`, `from`, `to`
6. Generate pagination links: `first`, `last`, `prev`, `next` — included in response `links`
7. Use `paginate()` with `appends()` to preserve query parameters across pages
8. Create index on sort column to optimize ORDER BY + LIMIT + OFFSET
9. Consider `simplePaginate()` when total count is not needed (avoids COUNT query)
10. Document limit on page depth if applicable — warn consumers about offset performance

## Validation Checklist
- [ ] `paginate()` or `simplePaginate()` used
- [ ] `page` parameter accepted, default 1
- [ ] `per_page` parameter accepted with max cap
- [ ] 422 for invalid page/per_page values
- [ ] Pagination metadata: current_page, per_page, total, last_page, from, to
- [ ] Links: first, last, prev, next
- [ ] `appends()` preserves query parameters
- [ ] Index on sort column
- [ ] Alternative to simplePaginate considered
- [ ] Page depth documented

## Common Failures
- No per_page cap — clients request 10000, server OOM
- No page validation — negative page numbers cause unexpected behavior
- No pagination metadata — client can't calculate total pages
- `appends()` not used — query parameters lost on page navigation
- `simplePaginate()` used when `total` needed — extra query on second call
- No index on sort — OFFSET 10000 + LIMIT 15 scans 10015 rows
- Deep pagination not documented — client pages to page 500, gets slow response

## Decision Points
- `paginate()` vs `simplePaginate()` — paginate for total count, simplePaginate for performance
- Max per_page — 100 for public, 500 for admin, configurable
- Default per_page — 15 for general, 50 for admin

## Performance Considerations
- Offset pagination at page 1000+ is slow — database scans all rows before offset
- `COUNT(*)` on large tables adds 100-500ms — use simplePaginate if total not needed
- Index on sort column improves ORDER BY performance but not OFFSET skipping
- Consider switching to cursor pagination if users commonly go beyond page 100

## Security Considerations
- Cap per_page to prevent resource exhaustion
- Validate page parameter to prevent negative or non-integer values
- Total count may expose data size — consider for sensitive filtered queries
- Pagination links must not expose internal URL patterns

## Related Rules
- Use paginate For Standard Offset Pagination
- Accept page And per_page Query Parameters
- Cap per_page At Configurable Maximum
- Return 422 For Invalid Pagination Parameters
- Include Full Pagination Metadata (current_page, total, links)
- Use appends() To Preserve Query Parameters

## Related Skills
- Pagination Strategy Selection — for choosing offset vs cursor
- Pagination Metadata Design — for response structure
- Query Parameter Filtering — for combined pagination and filtering
- Query Parameter Sorting — for combined pagination and sorting

## Success Criteria
- Offset pagination works correctly with page and per_page parameters
- per_page capped prevents abuse
- Invalid parameters return 422
- Full pagination metadata and links in response
- Query parameters preserved across pages
- Index on sort column for performance
- Page depth documented — consumers warned about performance at deep pages
