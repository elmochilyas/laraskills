# To Base Pattern — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** To Base Pattern
- **ECC Version:** 1.0

## Overview
`toBase()` returns the underlying Query Builder with all constraints built up through the Eloquent API, configured to return `stdClass` results instead of hydrated models. It is the simplest optimization in Laravel's ORM — keep the expressive Eloquent builder API while shedding hydration overhead. It is the first optimization to apply when profiling reveals that hydration is a bottleneck.

## Core Concepts
- `toBase()` returns `$this->getQuery()` — the underlying Query Builder instance
- Non-destructive: the original Eloquent Builder remains unchanged
- Constraint Preservation: WHERE, JOIN, ORDER BY, GROUP BY, HAVING, LIMIT are preserved
- Hydration Bypass: `get()` on the returned QB returns `stdClass` arrays, not Model instances
- Shared Reference: the returned QB is the SAME instance Eloquent Builder delegates to
- Eager Loads Lost: `with()` is NOT preserved — must convert to joins/subqueries

## When To Use
- Read-heavy queries where model features (events, accessors, casts) are unnecessary
- Reporting, exports, and dashboards with large result sets
- Bulk data processing jobs (CSV exports, ETL, data migrations)
- First optimization step before switching to raw `DB::table()`
- API endpoints returning lists where only specific columns are needed

## When NOT To Use
- Do NOT use when model events (`retrieved`) are needed for side effects
- Do NOT use when attribute casting or accessors are essential
- Do NOT use when eager loading (`with()`) cannot be replaced with joins/subqueries
- Do NOT use when global scopes behave differently with `toBase()` — verify scope timing first
- Do NOT use for individual record queries — savings on 1 row is negligible

## Best Practices (WHY)
- Call `toBase()` at the end of the chain, after all Eloquent-specific constraints are applied
- Use `toBase()` as the first optimization step before considering `DB::table()`
- Replace `with()` with explicit joins or subqueries when using `toBase()`
- Verify scope application timing — call `toSql()` before and after `toBase()` to compare
- Document WHY hydration is unnecessary (e.g., "Export CSV — no model features needed")
- Clone the builder if the original Eloquent Builder will be used elsewhere: `clone $builder->getQuery()`

## Architecture Guidelines
- Encapsulate `toBase()` calls in query objects to keep decisions centralized
- Use `toBase()` for read-model queries; keep Eloquent for write operations
- Add `@method` annotations or docstrings for queries that use `toBase()` returning non-model results
- Test both the SQL output and the data shape when using `toBase()`
- Consider creating a dedicated read-model class instead of returning raw `stdClass`

## Performance
- Eliminates all per-row hydration costs: 2-5µs per row saved
- Memory per row drops from ~2-4KB to ~0.5KB
- For 10k rows: ~20-50ms saved; for 100k rows: ~200-500ms saved
- No change to query execution time (same SQL, same database operations)
- `toBase()` call itself costs ~0.1µs — negligible

## Security
- `toBase()` may bypass global scopes that apply at execution time — verify before using
- Eager loads are lost — manually ensure related data doesn't expose unintended information
- `stdClass` results don't have model serialization — ensure output formatting is safe
- Shared QB reference means modifying the returned builder affects the original Eloquent Builder

## Common Mistakes
- Calling `toBase()` too early — before applying Eloquent-specific constraints that would be lost
- Assuming `toBase()` preserves `with()` — eager loads are NOT preserved
- Modifying the returned QB — since it's a shared reference, it affects the original Eloquent Builder
- Expecting model methods on results — `toBase()` returns `stdClass`, not models
- Double `get()` — `toBase()->get()` returns results; calling `->get()` again fails
- Missing soft delete filter — verify `SoftDeletingScope` applies before `toBase()` is called

## Anti-Patterns
- **Early toBase**: calling `toBase()` before applying scopes or constraints specific to Eloquent
- **Lost Eager Loads**: using `with()` then `toBase()` without converting to explicit joins
- **Shared Mutations**: modifying the `toBase()` return value and unintentionally changing the Eloquent Builder
- **toBase for Single Row**: using `toBase()` for a `find()` query — savings are negligible
- **Hidden toBase**: using `toBase()` in a repository without documenting the non-model return type

## Examples
```php
// Simple optimization
$users = User::where('active', true)->toBase()->get();
// Returns array of stdClass, not Collection of User models

// With scopes
$admins = User::admin()->verified()->toBase()->get();

// With aggregate
$count = User::whereNotNull('email_verified_at')->toBase()->count();

// With chunk
User::where('status', 'pending')
    ->toBase()
    ->chunk(100, function ($rows) {
        foreach ($rows as $row) {
            // $row is stdClass, no hydration overhead
        }
    });

// Cloning for isolation
$eloquentBuilder = User::where('active', true);
$queryBuilder = clone $eloquentBuilder->getQuery();
$queryBuilder->where('role', 'admin'); // doesn't affect $eloquentBuilder

// Documented decision
// toBase(): CSV export, no model features needed
$rows = User::where('created_at', '>=', $since)
    ->toBase()
    ->get();
```

## Related Topics
- Decision Framework — when to use `toBase()` vs Eloquent vs QB
- Hybrid Strategies — `toBase()` as the foundation of hybrid patterns
- Performance Tradeoffs — understanding when hydration is the bottleneck
- Global Scope Suppression — combined with `toBase()` for full control

## AI Agent Notes
- Call `toBase()` at the end of the chain, after all Eloquent constraints
- Replace `with()` with explicit joins or subqueries when using `toBase()`
- Document why `toBase()` is used (readability, performance requirement)
- Verify that global scopes are correctly applied before `toBase()`
- Remember that the returned QB shares a reference — clone if concurrent use is expected

## Verification
- [ ] `toBase()` called after all Eloquent-specific constraints
- [ ] Global scope behavior verified with `toBase()`
- [ ] `with()` calls replaced with explicit joins or subqueries
- [ ] No model methods called on `toBase()` results
- [ ] Performance improvement measured (saved hydration time confirmed)
- [ ] Shared reference handled correctly (cloned if needed for concurrent use)
- [ ] Data shape tested (callers know they receive stdClass, not models)
