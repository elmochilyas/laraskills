# Skill: Implement Cursor-Based Pagination

## Purpose
Implement cursor pagination using Laravel's `cursorPaginate()` for large/real-time datasets with opaque cursor parameter, `has_more` flag, and composite index optimization.

## When To Use
- Datasets >10K records
- Real-time data where new records should not shift pages
- Infinite scroll UI patterns
- Any dataset where offset becomes expensive at high page numbers

## When NOT To Use
- Small datasets (<1K records)
- Page-number navigation required by UI
- Admin panels with paginated tables

## Prerequisites
- Laravel CursorPaginator
- Composite indexes on sort columns

## Inputs
- Cursor pagination configuration
- Sort field specification

## Workflow
1. Use `Model::orderBy('id')->cursorPaginate($perPage)` — use `cursorPaginate()` instead of `paginate()`
2. Pass `cursor` query parameter from response's `next_cursor` value
3. Return `next_cursor`, `prev_cursor`, and `has_more` in pagination metadata
4. Ensure `has_more` is accurate — indicates whether another page exists
5. Create composite index on `(sort_field, id)` for efficient cursor queries
6. Default sort by `-created_at` with `id` tiebreaker for stable cursor
7. Validate cursor format — 422 for malformed cursor
8. Never expose raw sort field values in cursor — keep cursor opaque
9. Document cursor usage: initial request (no cursor), subsequent requests (cursor from response)
10. Combine with filtering and sorting — cursor works with WHERE and ORDER BY clauses

## Validation Checklist
- [ ] `cursorPaginate()` used instead of `paginate()`
- [ ] `cursor` parameter accepted as query input
- [ ] `next_cursor`, `prev_cursor`, `has_more` in response metadata
- [ ] `has_more` accurately indicates additional pages
- [ ] Composite index on `(sort_field, id)`
- [ ] Default sort with `id` tiebreaker
- [ ] Malformed cursor returns 422
- [ ] Cursor values are opaque
- [ ] Cursor usage documented
- [ ] Works with filtering and sorting parameters

## Common Failures
- No composite index — cursor pagination still does full scan
- Missing `id` tiebreaker — duplicate sort values cause missed/duplicate records
- Cursor not opaque — exposes sort field values allowing data enumeration
- Cursor serialization fragile — cursor invalid after model changes
- `has_more` inaccurate — last page shows `has_more: true` or vice versa
- Forward-only cursor — no `prev_cursor` for backward navigation
- Cursor pagination with complex WHERE clauses — performance depends on index coverage

## Decision Points
- Forward-only vs bidirectional cursor — forward for infinite scroll, bidirectional for table navigation
- Cursor encoding — base64 for compact opaque string, JSON for structured cursor
- Default sort — `-created_at` (desc) for feeds, `id` for stable lists

## Performance Considerations
- Cursor pagination is O(log n) with proper index vs O(n) for offset at high page numbers
- Composite index on `(sort_field, id)` is critical for performance
- `has_more` requires fetching one extra record beyond requested page
- Cursor pagination doesn't need COUNT query — faster for large datasets

## Security Considerations
- Cursor values must be opaque — encode/encrypt to prevent cursor manipulation
- Validate cursor format before decoding — prevent injection via malformed cursor
- Cursor decoded to query conditions must use bound parameters
- Cursor pagination doesn't expose total record count — prevents data size enumeration
- Rate-limit pagination-heavy requests — each page is another request

## Related Rules
- Use cursorPaginate For Large Datasets
- Create Composite Index On (sort_field, id)
- Include has_more For Page Existence Indicator
- Keep Cursor Opaque
- Default Sort With id Tiebreaker
- Validate Cursor Format

## Related Skills
- Pagination Strategy Selection — for choosing cursor vs offset
- Pagination Metadata Design — for pagination response structure
- Query Parameter Sorting — for sort with cursor pagination
- Query Parameter Filtering — for filter with cursor pagination

## Success Criteria
- Cursor pagination performs consistently regardless of dataset position
- No duplicate or missing records across cursor-based pages
- Opaque cursor prevents data enumeration and manipulation
- Composite index ensures efficient queries at any dataset size
- `has_more` accurately indicates page availability
- Cursor usage documented for client implementation
