# Anti-Patterns: Builder Fundamentals

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Builder Fundamentals

## Anti-Patterns

### Builder Reuse
Storing a builder instance and adding constraints incrementally for different queries. Builder state is mutable — each `where()`, `orderBy()`, or other constraint mutates the same instance. Reusing a builder carries over all previously added constraints, producing incorrect SQL for the second query.

**Problem:** A stored builder accumulates constraints from previous usage, leaking state between queries.

**Solution:** Always create fresh builder instances for separate queries. If you need to branch, clone explicitly: `$builder2 = clone $builder1`.

### Implicit Get
Forgetting `->get()` and passing the builder to a view (which calls `toArray()` on it). A builder chain without a terminal method returns a `Builder` instance instead of results.

**Problem:** Silent type errors — the builder serializes differently than a Collection, leading to unexpected behavior in views and APIs.

**Solution:** Always append a terminal method (`get`, `first`, `paginate`, `count`, `cursor`, `chunk`) to every retrieval-oriented builder chain.

### Raw Everywhere
Using `DB::raw()` for simple `WHERE` clauses that the builder supports natively. Native methods provide type safety, automatic binding management, database-agnostic SQL generation, and IDE autocompletion.

**Problem:** `DB::raw()` bypasses all these benefits and makes the code harder to maintain and port across database drivers.

**Solution:** Use Eloquent's native constraint methods (`where`, `orderBy`, `groupBy`, `having`) for all standard SQL clauses. Reserve `DB::raw()` for database-specific features not supported by the builder.

### Giant Chains
Single builder chain exceeding 20+ methods without extraction. Long chains are unreadable, untestable, and impossible to reuse.

**Problem:** Each constraint becomes harder to reason about, and the chain cannot be tested or reused in isolation.

**Solution:** Extract logical groups to local scopes, custom builder methods, or dedicated query objects. Keep chains under 15 methods.

### N+1 in Builder
Iterating builder results and lazily loading relationships inside the loop. This is the dominant Eloquent performance problem — one lazy-loaded relationship in a loop of 100 items adds 100 extra queries.

**Problem:** Hydration of 100 rows costs ~0.5ms; N+1 adds 100 database round trips (~500-5000ms).

**Solution:** Always eager-load relationships with `with()` before iterating results. Use `Model::preventLazyLoading()` in development to catch N+1 early.

### Get for Large Sets
Using `get()` to load result sets exceeding available memory. Each hydrated model consumes ~2-4KB of memory — 50,000 models at 3KB each = 150MB, exceeding typical PHP memory limits.

**Problem:** Out-of-memory crashes in production; PHP process killed by OOM killer.

**Solution:** Use `chunkById()` or `cursor()` for result sets exceeding 1000 rows. Use `select()` to limit columns.

### Builder Reuse After Terminal Method
Reusing a builder instance after a terminal method has been called on it. Builder state after execution is undefined — internal flags like `$scopesApplied` are set.

**Problem:** Intermittent query failures; unpredictable SQL output that varies by execution order.

**Solution:** Always create a fresh builder instance for separate queries. Never store and reuse a builder across terminal calls.
