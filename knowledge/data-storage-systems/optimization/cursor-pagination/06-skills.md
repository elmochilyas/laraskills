# Skill: Implement Cursor Pagination

## Purpose
Use `WHERE id > ? ORDER BY id LIMIT ?` pattern (Laravel `cursorPaginate()`) for constant-time pagination regardless of page depth.

## When To Use
- For API endpoints with large datasets
- For infinite scroll or "load more" UI patterns
- When response time must be consistent regardless of position

## When NOT To Use
- When numbered page navigation ("Go to page 5") is required
- When dataset is small (<1000 rows) — offset is simpler
- When cursor column lacks a unique guarantee

## Prerequisites
- Understanding of offset vs cursor performance difference
- Knowledge of Laravel `CursorPaginator`

## Inputs
- API endpoint requiring pagination

## Workflow
1. Ensure cursor column is unique and monotonically ordered (id, created_at)
2. Replace `Model::paginate(20)` with `Model::cursorPaginate(20)`
3. Return `nextCursor` and `previousCursor` in API response
4. Client passes cursor in request parameter
5. Verify EXPLAIN shows index range scan with constant rows

## Validation Checklist
- [ ] Cursor column is unique and indexed
- [ ] `cursorPaginate()` produces constant-time queries
- [ ] Next/previous cursors are opaque (encoded if exposing sequential IDs)
- [ ] ORDER BY column matches cursor column direction

## Common Failures
- Cursor on non-unique column — pagination skips or duplicates rows
- No tiebreaker for non-unique sort columns — use composite (col, id)
- Exposing raw sequential IDs as cursors — encode or use ULID/ UUID

## Decision Points
- Single-column cursor (id, created_at): simplest, use when sort is by that column
- Composite cursor (status, id): use when sorting by non-unique column
- Opaque cursor: encode with base64 or hashids for security

## Performance
- Each page: reads exactly `page_size` rows via index — O(log n)
- No degradation with page depth — true O(1) per page
- Index on cursor column is essential

## Security
- Encode cursor values if sequential IDs are a concern
- Cursor pagination doesn't expose total row count (feature, not bug)

## Related Rules
- 4-17-1: Always EXPLAIN Before Optimizing
- 4-17-4: Review And Apply Core Concepts

## Related Skills
- Avoid Deep Offset Pagination
- Implement Keyset Pagination

## Success Criteria
- Cursor pagination implemented and working
- Response time constant across all pages
- EXPLAIN shows index range scan with expected row count
