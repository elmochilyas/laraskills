# Skill: Avoid Deep Offset Pagination

## Purpose
Replace `offset()`-based pagination with cursor/keyset pagination for deep pages to prevent O(N) page cost.

## When To Use
- When implementing pagination for large datasets
- When offset pagination shows degrading performance with page depth
- For API endpoints with infinite scroll or "load more" patterns

## When NOT To Use
- When total rows are <10K (offset penalty is negligible)
- For admin panels with numbered page navigation (keep offset)

## Prerequisites
- Understanding of how OFFSET works internally
- Knowledge of cursor pagination with `cursorPaginate()`

## Inputs
- Existing `paginate()` query or manual `offset()` usage

## Workflow
1. Identify queries using `offset()` or `paginate()` with deep page access
2. Estimate future data growth — if >10K expected, switch to cursor pagination
3. Replace `Model::paginate(20)` with `Model::cursorPaginate(20)`
4. Ensure the cursor column is unique and indexed
5. Update frontend to use cursor-based navigation (next/prev cursor)

## Validation Checklist
- [ ] No `offset()` used for datasets that will exceed 10K rows
- [ ] `cursorPaginate()` used for large datasets with "load more" UI
- [ ] Cursor column is unique and indexed
- [ ] ORDER BY column matches cursor column direction

## Common Failures
- Using offset for mobile API pagination (deep pages over time)
- Forgetting ORDER BY — offset pagination without ORDER BY is inconsistent
- Cursor on non-unique column — pages skip/duplicate rows

## Decision Points
- Offset pagination (<10K rows, numbered pages): acceptable
- Cursor pagination (>10K rows, infinite scroll): required
- Keyset pagination (composite sort, non-unique sort column): use for complex ordering

## Performance
- Offset page N: reads offset+N rows — O(N)
- Cursor page N: reads page_size rows — O(1)
- Page 1000 of 20 items: offset reads 20,020 rows; cursor reads 20 rows

## Security
- Cursor values may expose sequential IDs — encode cursor in opaque tokens
- Offset pagination is safe — no data exposure

## Related Rules
- 4-16-1: Always EXPLAIN Before Optimizing
- 4-16-4: Review And Apply Core Concepts

## Related Skills
- Implement Cursor Pagination
- Implement Keyset Pagination
- Evaluate Chunk Method Tradeoffs

## Success Criteria
- Deep offset pagination replaced with cursor/keyset
- Page response time is constant regardless of depth
- EXPLAIN confirms index range scan (not full scan)
