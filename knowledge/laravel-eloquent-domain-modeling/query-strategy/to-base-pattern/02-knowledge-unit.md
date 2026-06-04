# To Base Pattern

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
The `toBase()` method on Eloquent Builder returns a Query Builder instance configured with all the constraints built up through the Eloquent API — but configured to return raw `stdClass` results instead of hydrated models. This pattern is the simplest and most strategic optimization available in Laravel's ORM: it keeps the expressive Eloquent query-building API (scopes, conditional clauses, subqueries) while shedding model hydration overhead. It is the first optimization to apply when profiling reveals that hydration is a bottleneck, serving as a stepping stone between pure Eloquent and full Query Builder queries.

## Core Concepts
- **`toBase()`** — Eloquent Builder method returning the underlying Query Builder
- **Non-destructive** — the original Eloquent Builder is unchanged; `toBase()` returns a separate instance
- **Constraint Preservation** — all WHERE, JOIN, ORDER BY, GROUP BY, and HAVING clauses are preserved
- **Hydration Bypass** — calling `get()` on the returned Query Builder returns `stdClass` arrays, not Model instances
- **Scope Behavior** — global scopes already applied to the builder are included; scopes that apply during `get()` (like `SoftDeletingScope`) may behave differently

## Mental Models
- **Escape Hatch** — `toBase()` is the escape hatch from Eloquent's model layer while staying in the builder API
- **Execution Switch** — think of it as flipping a switch at the end of query construction: "build this query with Eloquent, execute it without Eloquent"
- **Zero-Cost Abstraction** — the Eloquent builder API becomes a zero-cost abstraction when you call `toBase()` before execution

## Internal Mechanics
```php
// Simplified implementation
public function toBase()
{
    return $this->getQuery()->from($this->query->from);
}
```

`$this->getQuery()` returns the underlying `Illuminate\Database\Query\Builder` instance. The `from()` call ensures the table is set. The returned Query Builder has accumulated all the constraints that were delegated from Eloquent Builder.

Critical detail: the returned Query Builder is the SAME instance that the Eloquent Builder has been delegating to. Calling methods on it after `toBase()` also affects the original Eloquent Builder's state. If you need isolation, create a clone: `clone $eloquentBuilder->getQuery()`.

## Patterns
- **Simple Optimization** — `User::where('active', true)->toBase()->get()` — same SQL, raw results
- **With Scopes** — `User::active()->where('role', 'admin')->toBase()->get()` — scopes are applied in the Eloquent chain, execution is raw
- **With Aggregates** — `User::whereNotNull('email_verified_at')->toBase()->count()` — count is still raw, count results are integers regardless
- **With Pluck** — `User::where('active', true)->toBase()->pluck('name', 'id')` — pluck returns arrays, not collections of models
- **Chunked Processing** — `User::where('status', 'pending')->toBase()->chunk(100, function ($rows) { ... })` — memory-efficient bulk processing without hydration

## Architectural Decisions
- **Why `toBase()` Exists** — it provides a migration path from Eloquent to Query Builder without changing query construction logic; no other ORM has this exact pattern
- **When to Choose `toBase()` Over `DB::table()`** — when you need Eloquent's scoping or conditional clause facilities but not hydration
- **When to Choose `DB::table()` Over `toBase()`** — when you want to start fresh without any Eloquent/magic overhead; for standalone query construction

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Keeps Eloquent builder API | Returns stdClass, not models | Use with non-hydration paths (reports, exports, bulk) |
| Zero refactoring of constraint logic | Shared builder reference (mutability) | Clone builder if concurrent use is needed |
| Safest first optimization | Not all Eloquent features work (eager loads) | Convert `with()` to explicit joins/subqueries |
| Single method call to optimize | Subtle scope behavior differences | Verify scope application order |
|  |  |  |

## Performance Considerations
- `toBase()` eliminates all per-row hydration costs (2-5µs per row)
- For 10k rows: ~20-50ms saved; for 100k rows: ~200-500ms saved
- Memory per row drops from ~2-4KB to ~0.5KB
- No change to query execution time (same SQL, same database operations)
- The cost of calling `toBase()` itself is negligible (~0.1µs)

## Production Considerations
- **Verify scope behavior** — test that global scopes (especially `SoftDeletingScope`) are applied as expected when using `toBase()`
- **Handle shared reference** — if the builder is used after `toBase()`, be aware that both references point to the same Query Builder; clone if needed
- **Use with Query Objects** — encapsulate `toBase()` calls in query objects to keep the decision centralized and testable
- **Document the why** — add a comment when using `toBase()` to explain why hydration is unnecessary (e.g., "Reading CSV export data, no model features needed")

## Common Mistakes
- **Calling `toBase()` too early** — if you call `toBase()` before applying Eloquent-specific constraints (like `with()`, scopes that apply lazily), those features are lost
- **Assuming `toBase()` preserves `with()`** — eager loads are NOT preserved; they must be converted to joins or subqueries
- **Modifying the returned QB** — since `toBase()` returns the underlying QB instance, modifying it also modifies the original Eloquent Builder
- **Expecting model methods on results** — `toBase()` returns `stdClass`; calling `$result->toArray()` or `$result->relation` will fail
- **Double `get()`** — `User::...->toBase()->get()->get()` — the first `get()` returns the results; the second call fails because results is a Collection/array

## Failure Modes
- **Missing soft delete filter** — if `SoftDeletingScope` applies during model hydration (the `get()` call on Eloquent Builder), using `toBase()` before `get()` may cause the soft-delete filter to be applied differently. Actually, `SoftDeletingScope` applies on the Eloquent Builder during `boot()`, so it should be applied before `toBase()`. But test this.
- **Partial scope application** — some scopes apply during the `apply()` method which runs when the builder executes. If `toBase()` is called before execution, scopes that apply at execution time may not be included.
- **Binding leakage** — if raw expressions with manual bindings are in the chain, `toBase()` preserves them but the binding positions might differ when executed through Query Builder's `get()` vs Eloquent's `get()`.

## Ecosystem Usage
- **Laravel Nova** — uses `toBase()` internally for resource index queries to improve listing performance on large datasets
- **Laravel Excel** — export packages recommend `toBase()` + `chunk()` for large dataset exports
- **Spatie/QueryBuilder** — can be configured to use `toBase()` for the underlying query execution
- **Laravel Backup (Spatie)** — uses `toBase()` for reading database rows during backup dumps

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Eloquent Builder vs Query Builder

### Related Topics
Decision Framework, Performance Tradeoffs, Hybrid Strategies

### Advanced Follow-up Topics
Global Scope Suppression, Custom Builder Pattern, Domain-Specific Query Methods

## Research Notes
- **Source Analysis:** Defined in `Illuminate\Database\Eloquent\Builder::toBase()`. Returns `$this->query` (the Query Builder) with `from()` re-called to ensure the table is set.
- **Key Insight:** `toBase()` is the single most impactful optimization for Eloquent read-heavy workloads because it requires zero query restructuring — just append the method call before execution.
- **Version-Specific Notes:** In Laravel 9+, `toBase()` preserves the `$columns` property more reliably. Laravel 10+ documentation explicitly shows `toBase()` as the recommended pattern for read-model optimization. The `Model::hydrate()` method is the inverse operation for when you need to selectively hydrate some results.
