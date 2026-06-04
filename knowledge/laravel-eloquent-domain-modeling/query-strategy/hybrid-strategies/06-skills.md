# Skill: Implement Hybrid Eloquent-Query Builder Strategies

## Purpose
Combine Eloquent's expressive query-building API with Query Builder's performance characteristics using `toBase()`, manual hydration, and scope reuse for optimal read performance on large datasets.

## When To Use
- Queries benefiting from Eloquent scopes/conditions but returning many rows where hydration matters
- Reporting/export endpoints that need model scopes but not per-row model features
- Migrating from pure Eloquent to optimized queries incrementally
- CQRS-inspired architectures with read models that need partial Eloquent features
- Reusing existing scope logic in a new Query Builder context

## When NOT To Use
- Simple queries with small result sets — complexity outweighs gain
- When `toBase()` loses critical scope behavior — verify scope timing first
- When eager loads (`with()`) are essential and cannot be replaced with joins/subqueries
- Hybrid patterns scattered across controllers — encapsulate in query objects
- Manually hydrating large result sets — defeats the purpose of skipping hydration

## Prerequisites
- Builder Fundamentals (both Eloquent and Query Builder)
- Understanding of model hydration and scope timing
- Profiling tools

## Inputs
- Query requiring Eloquent scopes but returning many rows
- Performance measurement data
- Known hydration bottleneck

## Workflow
1. Build the query using Eloquent with all scopes and constraints
2. Apply `toBase()` as the primary hybrid tool before the terminal method
3. Verify global scope application by comparing SQL with and without `toBase()`
4. Replace `with()` with explicit JOINs or subqueries (eager loads are lost with `toBase()`)
5. Encapsulate hybrid logic in query objects, not inline in controllers
6. For selected rows needing model features: use `Model::hydrate()` on individual rows
7. Document the performance rationale with profiling evidence

## Validation Checklist
- [ ] `toBase()` used instead of `DB::table()` where Eloquent builder features are needed
- [ ] Global scope behavior verified with `toBase()`
- [ ] Eager loads converted to explicit joins or subqueries when using `toBase()`
- [ ] Hybrid logic encapsulated in query objects or repository classes
- [ ] SQL output verified with `toSql()` for hybrid chains
- [ ] Binding positions verified with `toRawSql()` when using `mergeBindings()`
- [ ] Performance improvement measured (not assumed)

## Common Failures
- Forgetting `toBase()` loses scopes — not all scopes are applied at the same point in the chain
- Double hydration: calling `get()` on a builder that already has `toBase()` applied
- Accidental N+1 from manually hydrating models and accessing lazy-loaded relationships
- Mixing connection configurations between Eloquent and QB connections
- Binding position errors with `mergeBindings()` — always test compiled SQL

## Decision Points
- `toBase()` vs `DB::table()`: prefer `toBase()` — it preserves Eloquent builder features; use `DB::table()` only when `toBase()` cannot express the query
- `toBase()` vs manual hydration: use `toBase()` for bulk results; use `Model::hydrate()` only for selective hydration of individual rows

## Performance Considerations
- Hybrid reduces overhead by 40-80% vs pure Eloquent for large result sets
- `toBase()` eliminates per-row hydration (2-5µs/row) while preserving query construction
- Manual hydration costs only for the rows you hydrate
- `toBase()` + `chunk()` is the most memory-efficient hybrid pattern for large exports

## Security Considerations
- `toBase()` may skip global scopes that enforce security boundaries — verify before using
- Manual hydration bypasses attribute casting — ensure raw data types match expectations
- `mergeBindings()` can misorder bindings — test compiled SQL
- Eager loads are lost with `toBase()` — manually add joins/subqueries for relationship data

## Related Rules
- Prefer toBase() Over Raw DB::table() for Hybrid Queries (query-strategy/hybrid-strategies)
- Encapsulate Hybrid Logic in Query Objects (query-strategy/hybrid-strategies)
- Verify Global Scope Application When Using toBase() (query-strategy/hybrid-strategies)
- Replace with() with Explicit Joins or Subqueries When Using toBase() (query-strategy/hybrid-strategies)
- Never Manually Hydrate Large Result Sets (query-strategy/hybrid-strategies)
- Test Binding Order When Using mergeBindings() (query-strategy/hybrid-strategies)
- Document the Performance Rationale for Every Hybrid Approach (query-strategy/hybrid-strategies)

## Related Skills
- Implement toBase Pattern for Hydration Bypass
- Choose Between Eloquent and Query Builder
- Evaluate Performance Tradeoffs with Profiling

## Success Criteria
- Hybrid query uses `toBase()` as primary optimization — not `DB::table()`
- Global scope application verified both with and without `toBase()`
- Eager loads replaced with explicit joins or subqueries
- Hybrid logic encapsulated in query objects
- Performance improvement measured and documented
