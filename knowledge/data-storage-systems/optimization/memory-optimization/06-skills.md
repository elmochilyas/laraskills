# Skill: Optimize Memory Usage

## Purpose
Reduce PHP memory consumption by avoiding full Eloquent model hydration for large result sets, using query builder, narrow selects, and streaming.

## When To Use
- When hydrating large collections (>10K models)
- When processing data for reports, exports, or batch operations
- When memory_limit errors occur

## When NOT To Use
- When returning small result sets (<100 models) for API/UI display
- When model methods or events are required

## Prerequisites
- Understanding of Eloquent hydration overhead
- Knowledge of query builder vs Eloquent memory differences

## Inputs
- Eloquent query that returns many rows

## Workflow
1. Measure memory usage of current approach: `memory_get_peak_usage(true)`
2. If reporting or aggregation: switch to query builder `DB::table()` — 10x less memory
3. If model methods needed: narrow columns with `->select('id', 'name')`
4. If processing many rows: use `cursor()` for streaming one row at a time
5. For dropdowns: use `pluck()` instead of loading full models

## Validation Checklist
- [ ] No full model hydration for reporting/aggregation queries
- [ ] Narrow column selection on large queries
- [ ] `pluck()` used for key-value lookups instead of full model loading
- [ ] Memory peak usage within 50% of `memory_limit`

## Common Failures
- Reporting through Eloquent: `Order::all()->groupBy('status')->map->count()` — hydrates everything
- Loading full models for API responses: `User::all()` for a dropdown
- Not using `cursor()` for large dataset processing

## Decision Points
- Need model methods/events: use Eloquent with narrow selects + cursor
- Need plain data: use query builder (stdClass)
- Need aggregation: use SQL `groupBy` + `selectRaw`
- Need key-value pairs: use `pluck()`

## Performance
- Eloquent model: ~1-2KB per model
- Query builder: ~0.1-0.2KB per row (stdClass)
- 100K rows: Eloquent ~200MB vs query builder ~20MB
- `cursor()`: constant memory regardless of row count (~2MB)

## Security
- Memory exhaustion can crash the application — monitor peak usage
- Query builder results don't trigger Eloquent events (safer for mass operations)

## Related Rules
- 4-20-1: Always EXPLAIN Before Optimizing
- 4-20-4: Review And Apply Core Concepts

## Related Skills
- Select Appropriate Chunk Method
- Aggregate in SQL Not Collections
- Know When to Drop to Query Builder

## Success Criteria
- Memory usage reduced to within acceptable limits
- Large datasets processed without memory exhaustion
- Appropriate tool chosen (Eloquent vs query builder vs cursor)
