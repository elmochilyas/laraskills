# Skill: Optimize Read Queries with toBase Pattern

## Purpose
Use `toBase()` to bypass Eloquent model hydration on read-heavy queries, keeping the expressive builder API while returning lightweight `stdClass` objects for significant memory and CPU savings on large result sets.

## When To Use
- Read-heavy queries where model features (events, accessors, casts) are unnecessary
- Reporting, exports, and dashboards with large result sets
- Bulk data processing jobs (CSV exports, ETL, data migrations)
- First optimization step before switching to raw `DB::table()`
- API endpoints returning lists where only specific columns are needed

## When NOT To Use
- When model events (`retrieved`) are needed for side effects
- When attribute casting or accessors are essential
- When eager loading (`with()`) cannot be replaced with joins/subqueries
- When global scopes behave differently with `toBase()` — verify scope timing first
- For individual record queries — savings on 1 row is negligible

## Prerequisites
- Builder Fundamentals
- Understanding of model hydration overhead
- Profiling data confirming hydration is a bottleneck

## Inputs
- Eloquent query builder with constraints and scopes applied
- Confirmed hydration bottleneck from profiling

## Workflow
1. Build the query using Eloquent with all scopes, WHERE clauses, and ordering
2. Call `toBase()` at the end of the chain, after all Eloquent constraints
3. Replace any `with()` calls with explicit JOINs or subqueries (eager loads are lost)
4. Verify global scope application by comparing SQL with and without `toBase()`
5. Add a code comment explaining why hydration is unnecessary
6. If the original Eloquent Builder will be reused, clone the underlying QB: `clone $builder->getQuery()`
7. Call `get()` on the returned Query Builder — returns `stdClass` results

## Validation Checklist
- [ ] `toBase()` called after all Eloquent-specific constraints
- [ ] Global scope behavior verified with `toBase()`
- [ ] `with()` calls replaced with explicit joins or subqueries
- [ ] No model methods called on `toBase()` results
- [ ] Performance improvement measured (saved hydration time confirmed)
- [ ] Shared reference handled correctly (cloned if needed for concurrent use)
- [ ] Data shape tested (callers know they receive stdClass, not models)

## Common Failures
- Calling `toBase()` too early — before applying Eloquent-specific constraints
- Assuming `toBase()` preserves `with()` — eager loads are NOT preserved
- Modifying the returned QB — since it's a shared reference, it affects the original Eloquent Builder
- Expecting model methods on results — `toBase()` returns `stdClass`, not models
- Double `get()` — `toBase()->get()` returns results; calling `->get()` again fails
- Missing soft delete filter — verify `SoftDeletingScope` applies before `toBase()`

## Decision Points
- `toBase()` vs `DB::table()`: use `toBase()` as the first optimization step — it preserves all Eloquent builder features and provides ~80% of the performance benefit; only use `DB::table()` when `toBase()` is insufficient
- `toBase()` at end vs middle of chain: always call `toBase()` at the end, after all Eloquent-specific constraints are applied

## Performance Considerations
- Eliminates all per-row hydration costs: 2-5µs per row saved
- Memory per row drops from ~2-4KB to ~0.5KB
- For 10k rows: ~20-50ms saved; for 100k rows: ~200-500ms saved
- No change to query execution time (same SQL, same database operations)
- `toBase()` call itself costs ~0.1µs — negligible

## Security Considerations
- `toBase()` may bypass global scopes that apply at execution time — verify before using
- Eager loads are lost — manually ensure related data doesn't expose unintended information
- `stdClass` results don't have model serialization — ensure output formatting is safe
- Shared QB reference means modifying the returned builder affects the original Eloquent Builder

## Related Rules
- Call toBase() After All Eloquent-Specific Constraints Are Applied (query-strategy/to-base-pattern)
- Use toBase() as the First Optimization Step (query-strategy/to-base-pattern)
- Never Expect with() to Work with toBase() (query-strategy/to-base-pattern)
- Verify Global Scope Application Before and After toBase() (query-strategy/to-base-pattern)
- Document Why toBase() Is Used (query-strategy/to-base-pattern)
- Clone the Underlying Query Builder If the Original Eloquent Builder Will Be Reused (query-strategy/to-base-pattern)
- Never Use toBase() for Single-Record Queries (query-strategy/to-base-pattern)

## Related Skills
- Implement Hybrid Strategies for Eloquent-QB Mixing
- Evaluate Performance Tradeoffs with Profiling
- Choose Between Eloquent and Query Builder

## Success Criteria
- `toBase()` used as first optimization step — not skipped to `DB::table()`
- Global scope application verified both with and without `toBase()`
- Eager loads replaced with explicit joins or subqueries
- Performance improvement measured and documented
- No `toBase()` on single-record queries
- Shared QB reference cloned when original builder is reused
