# Skill: Aggregate in SQL Not Collections

## Purpose
Always use SQL-side aggregation (`withCount`, `withSum`, `DB::raw`) instead of loading full collections and aggregating in PHP memory.

## When To Use
- When needing counts, sums, averages, mins, maxes from relationships
- When generating reports or dashboards
- When reviewing code that calls `->count()` on loaded collections

## When NOT To Use
- When full relationship data is also needed for display
- When aggregation logic cannot be expressed in SQL

## Prerequisites
- Knowledge of `withCount`, `withSum`, `withAvg`, `withExists`
- Understanding of `selectRaw` and `DB::raw`

## Inputs
- Eloquent query that loads relationships for aggregation

## Workflow
1. Identify `$model->relation->count()` or `$model->relation->sum('col')` patterns
2. Replace with `Model::withCount('relation')` or `Model::withSum('relation', 'col')`
3. For custom aggregations, use `selectRaw()` or subqueries
4. For mass assignment aggregation, use query builder `groupBy()` + `selectRaw()`
5. Verify query count dropped with `DB::getQueryLog()`

## Validation Checklist
- [ ] No `->relation->count()` in loops — use `withCount()`
- [ ] No loading relationships solely for aggregation
- [ ] `selectRaw` used for complex GROUP BY aggregations
- [ ] Query count reduced after refactoring

## Common Failures
- Collection count in a loop: loads all related models for every parent
- Loading relationships just to count them
- Using Eloquent for reporting aggregations instead of query builder

## Decision Points
- Use `withCount` for per-row relationship counts
- Use `selectRaw` with `groupBy` for report-style aggregation
- Use `DB::table()` for simple aggregation without model hydration

## Performance
- SQL aggregation: one query, database-optimized — O(log n)
- Collection aggregation: loads all data into PHP memory — O(n) memory + time
- Difference on 10K posts with comments: 2 queries vs 10K+ queries

## Security
- No additional security concerns
- `selectRaw` requires careful input handling for dynamic values

## Related Rules
- 4-15-1: Always EXPLAIN Before Optimizing
- 4-15-4: Review And Apply Core Concepts

## Related Skills
- Know When to Drop to Query Builder
- Optimize Memory Usage

## Success Criteria
- All aggregation moved to SQL side
- No unnecessary relationship loading for aggregation
- Memory usage reduced by avoiding collection hydration
