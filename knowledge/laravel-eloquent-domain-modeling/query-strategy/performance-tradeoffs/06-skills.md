# Skill: Evaluate Eloquent Performance Tradeoffs with Profiling

## Purpose
Use a cost model for Eloquent vs Query Builder overhead (hydration time, memory per model, N+1 cost) to make informed optimization decisions based on profiling data, not guesses.

## When To Use
- Deciding whether to optimize an existing query
- Choosing between Eloquent, `toBase()`, and Query Builder for a new query
- Debugging slow endpoints with suspected Eloquent overhead
- Setting query count budgets and performance baselines

## When NOT To Use
- Before fixing N+1 — N+1 is almost always the bigger problem
- For result sets < 100 rows — savings are negligible
- Without profiling data — never optimize based on assumptions

## Prerequisites
- Profiling tools: Debugbar, Telescope, Clockwork, or `DB::listen()`
- Builder Fundamentals
- Understanding of hydration, N+1, and eager loading

## Inputs
- Query to be profiled
- Expected row count
- Current performance measurement
- Performance requirements

## Workflow
1. Enable `Model::preventLazyLoading()` in development to catch N+1 first
2. Fix all N+1 problems before optimizing anything else
3. Profile the endpoint: measure query count, duration, and memory
4. Apply the cost model:
   - Hydration overhead: ~2-5µs per model, 2-4KB per model
   - `toBase()`: ~0.5µs per row, 0.5KB per row
   - N+1: one lazy load in a 100-item loop = 101 queries
5. If hydration is the bottleneck, apply `toBase()` first
6. Use `chunkById()` or `cursor()` for result sets > 10k rows
7. Select only needed columns with `select()`
8. Cache frequent query results with model-event-based invalidation

## Validation Checklist
- [ ] N+1 prevention active (`preventLazyLoading()` in development)
- [ ] All list/show endpoints have eager-loaded relationships
- [ ] No `get()` calls on result sets exceeding 10,000 rows
- [ ] Slow query threshold configured and monitored
- [ ] Caching strategy verified with correct invalidation
- [ ] `explain()` plans checked for hot queries
- [ ] Memory limits tested for streaming/export endpoints

## Common Failures
- Optimizing hydration before fixing N+1
- Using `get()` for large result sets — causes memory exhaustion
- Assuming `toBase()` is always faster — savings on 1-10 rows is ~20-50µs, invisible
- Forgetting `toBase()` skips scopes — may return unpartitioned data in multi-tenant apps
- Over-using `with()` — eager loading used on 5% of results wastes queries

## Decision Points
- Fix N+1 vs optimize hydration: always fix N+1 first — it's 1000x more impactful (saves N queries vs saves 2-5µs/row)
- `chunkById()` vs `cursor()`: use `chunkById()` for mutation-safe batch processing; use `cursor()` for true streaming iteration

## Performance Considerations
- Hydration: ~2-5µs per model; `toBase()`: ~0.5µs per row — 5-10x difference
- Memory: ~2-4KB per model vs ~0.5KB per stdClass — 4-10x difference
- N+1: one lazy-loaded relationship in a loop of 100 items = 101 queries instead of 2
- Eager loading: `with('posts.comments')` generates 2 additional queries regardless of result count
- Join row duplication: JOIN on one-to-many duplicates parent rows; hydration deduplicates

## Security Considerations
- Memory exhaustion from unbounded `get()` can crash the PHP process
- Long-running `cursor()` iterations hold database connections — can starve the connection pool
- Caching query results can expose stale data if cache invalidation is not correct

## Related Rules
- Fix N+1 Before Optimizing Hydration (query-strategy/performance-tradeoffs)
- Never Use get() for Result Sets Exceeding 10,000 Rows (query-strategy/performance-tradeoffs)
- Enable Model::preventLazyLoading() in Development (query-strategy/performance-tradeoffs)
- Use chunkById() for Stable Batch Pagination Over Simple Offset (query-strategy/performance-tradeoffs)
- Select Only Needed Columns to Reduce Hydration Overhead (query-strategy/performance-tradeoffs)
- Use cursor() Instead of chunk() for True Streaming Iteration (query-strategy/performance-tradeoffs)
- Cache Frequent Query Results with Correct Invalidation (query-strategy/performance-tradeoffs)

## Related Skills
- Choose Between Eloquent and Query Builder
- Implement toBase Pattern for Hydration Bypass
- Implement Hybrid Strategies for Eloquent-QB Mixing

## Success Criteria
- N+1 fixed before any other optimization
- Optimization decisions based on profiling data, not guesses
- Result sets > 10k rows use `chunkById()` or `cursor()` instead of `get()`
- Hydration overhead measured and only optimized when confirmed as bottleneck
- Caching strategy in place for frequent read-heavy queries
