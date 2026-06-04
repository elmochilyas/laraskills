# Skill: Set Up Pagination Strategy Selection

## Purpose
Select between offset-based (`paginate()`) and cursor-based (`cursorPaginate()`) pagination per endpoint based on dataset size, real-time requirements, frontend UX needs, and offset depth.

## When To Use
- Before implementing any list endpoint
- When evaluating pagination approach
- When migrating from offset to cursor pagination

## When NOT To Use
- Single-resource or fixed small-set endpoints

## Prerequisites
- Understanding of offset and cursor pagination
- Dataset size and growth estimates

## Inputs
- Endpoint list specification
- Dataset characteristics (size, growth rate, update frequency)

## Workflow
1. Evaluate dataset size — offset works for <10K records, cursor for larger
2. Assess real-time requirements — cursor pagination handles real-time inserts better
3. Evaluate UI requirements — page number navigation requires offset pagination
4. Check offset depth — if users paginate beyond page 100, prefer cursor
5. Consider data stability — fast-changing data (real-time feeds) favors cursor
6. For offset pagination: use `paginate($perPage)`, respect `page` parameter
7. For cursor pagination: use `cursorPaginate($perPage)`, respect `cursor` parameter
8. Use `simplePaginate()` for count-less offset when `total` not needed (performance)
9. Document pagination approach per endpoint in API docs
10. Test pagination performance with realistic dataset sizes

## Decision Matrix

| Factor | Offset Pagination | Cursor Pagination |
|--------|-------------------|-------------------|
| Dataset < 10K rows | ✓ Fast | ✓ Works |
| Dataset > 10K rows | ✗ Slow at high offset | ✓ Fast |
| Page number navigation | ✓ Supported | ✗ Not supported |
| Real-time data | ✗ Misses/shifts | ✓ Stable |
| UI pagination controls | ✓ Compatible | ✗ "Load more" only |
| COUNT query required | ✓ Yes (paginate()) | ✗ No (cursorPaginate()) |
| Skip to page N | ✓ Yes | ✗ No (sequential only) |

## Common Failures
- Offset pagination on 100K+ row tables — slow at page 1000+
- Cursor pagination when UI requires page number controls — not compatible
- No pagination at all — returning all records, causing memory/timeout issues
- Default per_page too high (500) for mobile clients — slow responses
- Pagination strategy not documented — consumer can't plan integration

## Decision Points
- Offset vs cursor — offset for admin panels with page numbers, cursor for API feeds
- simplePaginate vs paginate — simplePaginate when total count is expensive and unnecessary
- Default per_page — 15 for general, 50 for admin, configurable with cap

## Performance Considerations
- `COUNT(*)` on 1M+ row tables takes 100-500ms — consider `simplePaginate()` or cursor
- Cursor pagination with composite index on `(sort_field, id)` is fastest option
- Offset at 10000+: database scans and skips 10000 rows — unacceptable for most APIs
- Cursor pagination scales to unlimited pages without performance degradation

## Security Considerations
- Cursor values must be opaque — don't expose sort field values directly
- Offset pagination with large `page` values can be used for DoS — cap at reasonable max
- Rate-limit pagination-heavy requests — each page is another request
- Cursor manipulation — validate cursor format and signature to prevent injection

## Related Rules
- Evaluate Dataset Size Before Choosing Pagination Strategy
- Use Offset For Page-Numbers, Cursor For Large/Real-Time Data
- Document Pagination Approach Per Endpoint
- Test Pagination With Realistic Dataset Sizes
- Apply Max per_page Cap For All Pagination Strategies

## Related Skills
- Pagination Metadata Design — for pagination response structure
- Query Parameter Filtering — for combined pagination and filtering
- Query Parameter Sorting — for combined pagination and sorting

## Success Criteria
- Pagination strategy matches dataset size and real-time requirements
- Endpoints with <10K rows use offset pagination with page numbers
- Endpoints with >10K rows or real-time data use cursor pagination
- per_page capped to prevent performance abuse
- Pagination strategy documented per endpoint
- Pagination performance tested with realistic data volumes
