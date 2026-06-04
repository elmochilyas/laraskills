# Skill: Know When to Drop to Query Builder

## Purpose
Use query builder (`DB::table()`) or raw SQL instead of Eloquent when model hydration overhead is unnecessary for reporting, aggregation, or database-specific features.

## When To Use
- For dashboard aggregation and reporting queries
- For large result sets where memory matters
- When using database-specific features (window functions, CTEs, JSON operators)

## When NOT To Use
- When model methods, relationships, or events are needed
- When the result set is small (<100 rows)

## Prerequisites
- Knowledge of Laravel query builder methods
- Understanding of Eloquent hydration overhead

## Inputs
- Query requirements and dataset size

## Workflow
1. Determine if model methods/relationships are needed in the result
2. If no model methods needed: use `DB::table('table')` — stdClass results
3. For database-specific features: use `DB::select('SELECT ...')` with raw SQL
4. For aggregation: use `selectRaw()` with `groupBy()` in query builder
5. Verify memory usage difference with large datasets

## Validation Checklist
- [ ] Reporting/aggregation uses query builder, not Eloquent
- [ ] Database-specific features use raw SQL where query builder can't express
- [ ] No Eloquent hydration for result sets > 10K rows where model features aren't used

## Common Failures
- Using Eloquent for everything: `Order::all()->groupBy('status')->map(fn($g) => $g->sum('total'))`
- Not using query builder for reporting even when no model features are needed
- Using Eloquent for mass exports where memory is constrained

## Decision Points
- Need model methods/events: use Eloquent
- Need plain data: use query builder (10x less memory)
- Need database-specific feature: use raw SQL
- Need aggregation: use query builder with selectRaw

## Performance
- Query builder: ~0.1-0.2KB per row (stdClass)
- Eloquent: ~1-2KB per row (model object with metadata)
- 50K rows: 5-10MB vs 50-100MB

## Security
- Raw SQL requires parameter binding to prevent injection
- `DB::select('...', [$params])` is safe with bound parameters

## Related Rules
- 4-23-1: Always EXPLAIN Before Optimizing
- 4-23-4: Review And Apply Core Concepts

## Related Skills
- Aggregate in SQL Not Collections
- Optimize Memory Usage

## Success Criteria
- Appropriate query layer chosen (Eloquent vs query builder vs raw SQL)
- Memory usage significantly reduced for large result sets
- Database-specific features accessible when needed
