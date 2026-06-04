# Skill: Process Query Results with Higher Order Messages

## Purpose
Use Eloquent's Higher Order Messages (`each()`, `map()`, `filter()`, `tap()`, `pipe()`) directly on builder instances to process results fluently without separate `get()` calls.

## When To Use
- `each()` for batch processing of large datasets (sending emails, updating records)
- `filter()` for permission-based or computed-field filtering that can't be done in SQL
- `map()` for lightweight transformations on small-to-medium result sets
- `tap()` for logging or monitoring mid-chain without affecting results
- `pipe()` for grouping, reducing, or reshaping result collections

## When NOT To Use
- `map()` or `filter()` for large datasets — they load all results into memory
- `each()` for simple iteration when you need to chain further collection methods
- HOMs when a SQL `WHERE` clause can express the filter — push filtering to the database
- Lazy-loading relationships inside `each()` callbacks — eager-load before the HOM
- Using HOMs for side effects that modify the query source during iteration

## Prerequisites
- Builder Fundamentals — terminal methods and query execution
- Understanding of `get()` vs `cursor()` execution paths

## Inputs
- Eloquent builder with constraints
- HOM callback (closure)
- Expected result size (to choose between `each()` and `map()`)

## Workflow
1. Build the query with all constraints and eager loads (`with()`)
2. Choose the right HOM:
   - `->each(...)` for memory-safe, side-effect iteration (uses `cursor()`)
   - `->map(...)` for transformation on small datasets (uses `get()`)
   - `->filter(...)` for post-query filtering that SQL cannot express
   - `->tap(...)` for logging/debugging without affecting results
   - `->pipe(...)` for complex collection transformations
3. Eager-load relationships before HOMs to avoid N+1
4. Keep HOM chains to 3 methods maximum
5. Never call `get()` before HOMs — HOMs internally execute the query

## Validation Checklist
- [ ] `map()` and `filter()` only used for small result sets (< 1000 records)
- [ ] Relationships eager-loaded before HOM chains
- [ ] `each()` callbacks do not modify the query source during iteration
- [ ] Connection not saturated by long-running `cursor()` iterations
- [ ] No N+1 from lazy loading inside HOM callbacks
- [ ] HOM chains are 3 methods max
- [ ] `tap()` not used for state mutation

## Common Failures
- Loading relationships inside `each()` — triggers N+1
- Using `map()` for huge datasets — loads all results into memory
- Confusing `first()` HOM with builder `first()` — HOM `first()` returns first result after a predicate
- Assuming `each()` returns a collection — it returns `void`
- Calling `get()` before HOMs — query executed twice

## Decision Points
- `each()` vs `map()`: use `each()` for side effects (returns void, memory-safe via cursor); use `map()` for transformations (returns collection, loads all results)
- `filter()` HOM vs SQL `WHERE`: always prefer SQL `WHERE` — database filters are faster and more memory-efficient; use `filter()` only for computed conditions that cannot be expressed in SQL
- `tap()` vs `pipe()`: use `tap()` for observation without modification; use `pipe()` for intentional transformation

## Performance Considerations
- `each()` uses `cursor()` — memory-efficient, one row at a time
- `map()` and `filter()` call `get()` — load all results into memory
- `cursor()` uses unbuffered queries — connection stays busy until iteration finishes
- N+1 risk inside callbacks — always eager-load before HOMs

## Security Considerations
- Avoid expensive I/O inside callbacks that could be exploited for timing attacks
- Ensure callbacks do not expose sensitive data through logging or error messages
- Validate user input used inside HOM callbacks

## Related Rules
- Use each() for Side Effects Only — It Returns Void (query-strategy/higher-order-messages)
- Eager-Load Relationships Before Higher Order Message Chains (query-strategy/higher-order-messages)
- Use filter() HOM Only When SQL Cannot Express the Condition (query-strategy/higher-order-messages)
- Limit HOM Chains to 2-3 Methods Maximum (query-strategy/higher-order-messages)
- Never Call get() Before HOMs (query-strategy/higher-order-messages)
- Avoid map() for Large Datasets (query-strategy/higher-order-messages)
- Use tap() for Logging and Monitoring, Not for State Mutation (query-strategy/higher-order-messages)

## Related Skills
- Implement Memory-Efficient Streaming with cursor
- Compose Conditional Query Chains with when()
- Evaluate Performance Tradeoffs with Profiling

## Success Criteria
- `each()` correctly used for memory-safe side effects on large datasets
- `map()` and `filter()` limited to known-small result sets
- Relationships eager-loaded before HOM chains — no N+1
- HOM chains are concise and readable (< 4 methods)
- `tap()` not used for mutation
