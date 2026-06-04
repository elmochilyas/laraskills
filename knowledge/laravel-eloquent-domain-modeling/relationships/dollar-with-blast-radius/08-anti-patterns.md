# Anti-Patterns: $with Blast Radius

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** $with Blast Radius

## Anti-Patterns

### Convenience $with on Widely-Used Models
Adding `protected $with = ['profile']` to the `User` model because profile is "usually" needed. This affects every query across controllers, commands, jobs, tests, and seeders — the blast radius is enormous.

**Problem:** Hidden, unconditional query overhead on every model retrieval across the entire application; slows down test suites, batch jobs, and API endpoints that don't need the relationship.

**Solution:** Prefer explicit `with()` at the query site — it's self-documenting and scoped. Never use `$with` on widely-used models like `User`.

### Compounding $with
Model A has `$with = ['b']`, Model B has `$with = ['c']`. When A eager-loads B, B's `$with` also loads C — a cascade of hidden queries across the relationship chain.

**Problem:** Cascading 3+ hidden queries per retrieval; each model's `$with` compounds with others in the chain.

**Solution:** Keep `$with` to 0–1 relationships maximum. Use explicit `with()` at the query site for everything else.

### $with as a Substitute for Eager Loading Discipline
Using `$with` to avoid adding explicit `with()` calls throughout the codebase. This masks lazy loading problems and makes query patterns invisible.

**Problem:** Hidden performance regressions; difficult to understand what queries a page executes.

**Solution:** Enable `preventLazyLoading()` in development and use explicit `with()` for all relationship loading.

### Hidden N+1 Mask
`$with` loading a relationship on every query masks the fact that the relationship is accessed in loops. The extra query is always present but only "saves" N+1 when the relationship is actually accessed.

**Problem:** Relationship is always loaded (extra query cost) even when not needed; real N+1 issues remain undetected.

**Solution:** Rely on eager loading at the query site and `preventLazyLoading()` for N+1 detection.

### $with in Tests
Adding relationships to `$with` on models used heavily in tests. Every factory creation and model retrieval in assertions adds unnecessary eager loading queries.

**Problem:** Slower test suite execution; unnecessary queries in every test that touches the model.

**Solution:** Use `withoutEagerLoads()` in test setup or avoid `$with` on test-affected models.

### No Opt-Out Mechanism in Batch Jobs
Running batch-processing jobs without suppressing `$with`. Every chunk iteration loads the relationship, adding gigabytes of unnecessary memory pressure.

**Problem:** Memory exhaustion in queue workers; unnecessary database load in batch operations.

**Solution:** Use `Model::withoutEagerLoads()` or `Model::withoutEagerLoads(function () { ... })` in batch jobs.
