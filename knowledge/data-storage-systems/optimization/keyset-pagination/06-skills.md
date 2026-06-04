# Skill: Implement Keyset Pagination

## Purpose
Use composite column pagination (`WHERE (col1, col2) > (?, ?)`) for stable, constant-time pagination through sorted result sets with non-unique sort columns.

## When To Use
- When sorting by non-unique columns (status, category)
- When cursor pagination on a single column isn't stable
- When ORDER BY needs multiple columns

## When NOT To Use
- When sorting by a unique, monotonically ordered column (use simple cursor)
- When dataset is small

## Prerequisites
- Understanding of composite index row ordering
- Knowledge of tuple comparison in SQL

## Inputs
- Query requiring pagination with non-unique sort column

## Workflow
1. Identify the sort columns and direction
2. Add a unique tiebreaker column (typically PK) as the last sort column
3. Create composite index matching the ORDER BY columns
4. Replace offset with: `WHERE (sort_col, id) < ($lastSortVal, $lastId) ORDER BY sort_col DESC, id DESC LIMIT 20`
5. Pass last row's values as pagination cursor

## Validation Checklist
- [ ] Tiebreaker column included in sort for stability
- [ ] Composite index matches sort column order
- [ ] EXPLAIN shows index range scan
- [ ] No skipped or duplicated rows between pages

## Common Failures
- No tiebreaker column — pagination misses or duplicates rows on non-unique values
- Index doesn't match sort — database performs full scan
- Tuple comparison syntax incorrect — `WHERE (a, b) > (x, y)` not `WHERE a > x AND b > y`

## Decision Points
- Sort by created_at: tiebreak with id `WHERE (created_at, id) < (?, ?)`
- Sort by status: tiebreak with id `WHERE (status, id) > (?, ?)`
- Sort by category + created_at: use all three `WHERE (cat, created_at, id) > (?, ?, ?)`

## Performance
- Keyset: reads exactly `page_size` rows — O(log n)
- No offset: constant regardless of total rows
- Requires composite index on sort columns + tiebreaker

## Security
- Keyset values may expose data ordering patterns
- Encode cursor in opaque token for public APIs

## Related Rules
- 4-18-1: Always EXPLAIN Before Optimizing
- 4-18-4: Review And Apply Core Concepts

## Related Skills
- Avoid Deep Offset Pagination
- Implement Cursor Pagination

## Success Criteria
- Keyset pagination stable across pages (no duplicates/misses)
- Response time constant regardless of position
- Composite index created matching sort columns
