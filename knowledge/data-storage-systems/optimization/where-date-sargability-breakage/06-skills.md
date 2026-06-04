# Skill: Write Sargable Date Filters

## Purpose
Replace Eloquent's `whereDate`, `whereMonth`, `whereYear`, `whereDay`, and `whereTime` with sargable range queries that use indexes.

## When To Use
- When filtering by date columns in Eloquent queries
- When reviewing queries that use date helper methods
- When EXPLAIN shows `ALL` on a date-filtered query with an index

## When NOT To Use
- On very small tables (<1000 rows) where index usage doesn't matter
- When using PostgreSQL functional indexes on `DATE(col)`

## Prerequisites
- Understanding of sargability
- Knowledge of Carbon date manipulation

## Inputs
- Eloquent query using date helper methods

## Workflow
1. Identify `whereDate()`, `whereMonth()`, `whereYear()`, `whereDay()`, `whereTime()` calls
2. Replace with range comparisons using Carbon:
   - `whereDate('created_at', $date)` → `whereBetween('created_at', [$date->startOfDay(), $date->copy()->addDay()->startOfDay()])`
   - `whereMonth('created_at', 1)` → range from `$date->startOfMonth()` to `$date->copy()->addMonth()->startOfMonth()`
3. Verify with EXPLAIN that `type` is `range` instead of `ALL`

## Validation Checklist
- [ ] No `whereDate`/`whereMonth`/`whereYear`/`whereDay`/`whereTime` on indexed columns
- [ ] Range queries use half-open intervals `[start, end)` with `startOfNextDay()` for microsecond safety
- [ ] EXPLAIN shows range scan instead of full table scan

## Common Failures
- `whereDate` inside a local scope that is used across many queries
- `whereDate` in JOIN conditions — double index bypass on the joined table
- Using `endOfDay()` instead of `startOfNextDay()` — misses rows with microsecond timestamps at midnight

## Decision Points
- Use `$date->startOfNextDay()` instead of `$date->endOfDay()` for precision
- Extract date filter logic into a local scope that uses range queries
- For month/year filtering, compute the date range explicitly

## Performance
- Sargable date range: uses index — O(log n + range size)
- Non-sargable whereDate: full table scan — O(n)
- On 100K rows: ~2ms vs ~200ms

## Security
- No direct security implications
- Carbon date objects are type-safe

## Related Rules
- 4-8-1: Always EXPLAIN Before Optimizing
- 4-8-4: Review And Apply Core Concepts

## Related Skills
- Write Sargable WHERE Conditions
- Detect Function Wraps in WHERE

## Success Criteria
- All date helper methods replaced with range queries
- EXPLAIN confirms index range scan
- No regressions in query results (boundary conditions verified)
