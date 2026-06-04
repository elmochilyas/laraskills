# Anti-Patterns: Higher Order Messages

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Higher Order Messages

## Anti-Patterns

### Map for Large Sets
Using `map()` on 100k+ records. `map()` calls `get()` internally, loading the entire result set into memory as hydrated models. For 50k records at ~3KB per model, that's 150MB — almost certainly an out-of-memory crash.

**Problem:** Out-of-memory crashes in production; PHP process killed by OOM killer; request timeouts.

**Solution:** Use `cursor()` with manual iteration for large datasets. Reserve `map()` for known-small result sets (< 1000 records).

### Hidden N+1
Calling relationships inside `each()`, `map()`, or `filter()` callbacks without eager loading. Accessing `$user->posts` inside an `each()` callback triggers a query for every user — N+1.

**Problem:** 1 + N queries instead of 2; severe performance degradation on large datasets; database server overload.

**Solution:** Always call `with()` to eager-load relationships before using any HOM that accesses related data in its callback.

### Side Effect in Filter
Performing writes or I/O inside a `filter()` predicate. `filter()` should be a pure, deterministic check — not a place for mutations or external calls.

**Problem:** Hard-to-debug side effects triggered conditionally; impure predicates with unpredictable behavior; testing difficulty.

**Solution:** Limit `filter()` callbacks to read-only predicate checks. Use `each()` for side effects.

### Unbounded Cursor
Long-running `each()` iteration without progress tracking or timeout. `each()` uses `cursor()` which holds the database connection until iteration finishes.

**Problem:** Connection pool starvation from long-running cursors; hung processes; database connection exhaustion.

**Solution:** Add progress tracking, timeouts, or batch boundaries (`chunkById()`) for long-running iterations.

### HOM Over SQL
Using `filter()` HOM when a `WHERE` clause could express the condition. `filter()` loads ALL results into memory first, then filters in PHP. SQL `WHERE` filters at the database level.

**Problem:** Memory exhaustion on large result sets; unnecessary database I/O transferring discarded rows; slower response times.

**Solution:** Prefer SQL `WHERE` clauses for all conditions that the database can express. Reserve `filter()` for computed conditions that cannot be expressed in SQL.

### Calling `get()` Before HOMs
Calling `get()` before using HOMs like `each()`, `map()`, or `filter()`. HOMs internally call `get()` or `cursor()` to execute the query — calling `get()` first doubles execution.

**Problem:** Query executed twice; doubled memory usage; doubled database I/O; confusion about builder vs collection API.

**Solution:** Chain HOMs directly on the builder without an intermediate `get()`. HOMs execute the query internally.

### Using `tap()` for Mutation
Using the `tap()` HOM to mutate or transform results. `tap()` passes the collection through unchanged — it is designed for side-effect inspection only.

**Problem:** Confusing code where it's unclear if `tap()` mutated the collection; bugs from unexpected side effects in observation callbacks.

**Solution:** Use `tap()` exclusively for logging, monitoring, and debugging that should not affect results. Use `pipe()` for intentional transformations.
