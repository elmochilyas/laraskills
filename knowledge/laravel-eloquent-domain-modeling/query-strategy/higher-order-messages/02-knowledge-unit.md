# Higher Order Messages

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Higher Order Messages (HOMs) on Eloquent Builder enable collection-like iteration methods — `each()`, `map()`, `filter()`, `reject()`, `tap()`, `pipe()` — directly on the builder before execution. These methods combine query construction with collection processing in a fluent pipeline. Unlike terminal methods that return hydrated results, HOMs on the builder return `HigherOrderBuilderProxy` instances that defer execution until iteration. The pattern is essential for expressive query pipelines that transform builder state, process results lazily, or apply collection operations mid-chain.

## Core Concepts
- **HigherOrderBuilderProxy** — a proxy object that intercepts method calls on the builder and defers them to collection results
- **`each()`** — iterate over query results lazily, executing a callback per record without loading all results at once
- **`map()`** — transform each result through a callback, returning a new Collection
- **`filter()`** — filter results by a callback predicate, returning a filtered Collection
- **`reject()`** — inverse of filter; removes matching items
- **`tap()`** — pass-through that executes a side-effect callback; returns the collection unchanged
- **`pipe()`** — pass the collection through a transforming function
- **`first()`** — return the first matching record (not to be confused with builder's `first()`)

## Mental Models
- **Lazy Pipeline** — think of HOMs as pipes in a stream: query → filter → map → reduce; each step processes one record at a time
- **Builder-Collection Bridge** — HOMs bridge the builder world (query construction) with the collection world (result processing)
- **Deferred Execution** — the builder is not executed until iteration begins; HOMs registered before iteration are composed into a transformation pipeline

## Internal Mechanics
When you call `User::where('active', true)->each(function ($user) { ... })`, Laravel detects that `each` is not a native builder method. The builder's `__call` magic method checks if the method is a collection method. If so, it creates a `HigherOrderBuilderProxy`, storing a reference to the builder. The proxy then intercepts the `each()` call and:

1. Calls `$builder->cursor()` (lazy collection) or `$builder->get()` depending on the HOM
2. Applies the collection method to the results
3. Returns the result

For `each()`, the proxy uses `cursor()` internally, enabling memory-efficient iteration over large result sets. For `map()` and `filter()`, the proxy calls `get()` to hydrate all results, then applies the transformation.

```php
// Simplified proxy behavior for each()
public function each(callable $callback)
{
    foreach ($this->builder->cursor() as $key => $value) {
        $callback($value, $key);
    }
}
```

## Patterns
- **Batch Processing** — `User::where('active', true)->each(fn($user) => $user->sendWelcomeEmail())` — process records without loading all into memory
- **Transform and Collect** — `User::active()->map(fn($u) => ['id' => $u->id, 'name' => $u->name])` — extract specific fields after query
- **Filter and Reject** — `User::where('team_id', $teamId)->filter(fn($u) => $u->hasPermission('edit'))`
- **Tap for Side Effects** — `User::active()->tap(fn($c) => Log::info('Processing '.$c->count().' users'))->each(...)`
- **Pipe for Transformation** — `User::active()->pipe(fn($c) => $c->groupBy('department_id'))`
- **Chained HOMs** — combine `filter` then `map` then `pipe` for complex result pipelines

## Architectural Decisions
- **Why Proxy Instead of Direct Methods?** — keeping HOMs off the builder interface prevents API bloat. The proxy pattern allows collection methods to be available transparently without adding hundreds of methods to the builder.
- **Why `cursor()` for `each()`?** — memory safety. `each` processes records one at a time, and `cursor()` uses a yield-based generator that doesn't load all results simultaneously.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Memory-efficient iteration (each/cursor) | `map` and `filter` load all results | Use `cursor()` with manual iteration for huge datasets |
| Fluent pipeline from query to result | Magic proxy can confuse type analysis | Document HOM chains explicitly |
| No builder method bloat | Debugging proxy calls is harder | Use `dd()` before HOM to inspect builder state |
|  |  |  |

## Performance Considerations
- **`each()` uses cursor()** — memory-efficient for large datasets; processes one row at a time via generator
- **`map()` and `filter()` call `get()`** — loads all results into memory; use with limits or known-small result sets
- **`chunk()` vs `each()`** — `chunk()` fetches in pages (default 100), which can be faster for some databases due to buffered queries; `cursor()` uses unbuffered queries (MySQL) which tie up the connection
- **N+1 risk** — calling relations inside `each()` or `map()` closures triggers lazy loading; eager-load before HOM

## Production Considerations
- **Unbuffered queries** — `cursor()` uses MySQL's unbuffered queries; the connection is busy until iteration finishes. Don't run other queries on the same connection during iteration.
- **Memory in `map`/`filter`** — if the result set is large, `map()` and `filter()` cause memory spikes. Use `each()` for side effects and `reduce()` for aggregations.
- **Transaction safety** — long-running `each()` iterations inside a transaction can hold locks for too long. Keep transactions short.
- **Logging in HOMs** — avoid slow I/O inside `each()` callbacks for large datasets; batch operations where possible.

## Common Mistakes
- **Loading relationships inside `each()`** — triggers N+1: `->each(fn($u) => $u->posts->count())` loads posts per user. Eager-load first: `->with('posts')->each(...)`
- **Using `map()` for huge datasets** — loads all results into memory; use `cursor()` with manual `yield` transformation
- **Confusing `first()` HOM with builder `first()`** — `$builder->first()` returns one model; `$builder->first(fn($u) => ...)` is a HOM that returns the first collection result after a callback
- **Assuming `each()` returns a collection** — `each()` returns `void` (or the builder for `each()` on the proxy); it's for side effects, not result transformation

## Failure Modes
- **Connection saturation** — long-running `cursor()` iteration blocks the connection; other queries queue up
- **Memory spike from `map()`** — loading and transforming 100k records in one `map()` call exhausts PHP memory
- **Infinite loops** — accidentally modifying the query source inside `each()` (e.g., inserting/updating records that affect the query) can cause infinite iteration

## Ecosystem Usage
- **Laravel Collections** — HOMs on builders mirror Laravel Collection methods; developers familiar with collections can apply the same patterns to queries
- **Laravel Horizon** — uses `each()` for processing job batches
- **Laravel Nova Actions** — uses `each()` internally for action processing on query results

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Laravel Collections

### Related Topics
To Base Pattern, Performance Tradeoffs, Hybrid Strategies

### Advanced Follow-up Topics
Custom Builder Pattern, Domain-Specific Query Methods

## Research Notes
- **Source Analysis:** `HigherOrderBuilderProxy` is defined in `Illuminate\Database\Eloquent\HigherOrderBuilderProxy`. The builder's `__call` magic method in `Illuminate\Database\Eloquent\Builder` detects collection methods and returns the proxy.
- **Key Insight:** The proxy pattern allows the builder to present a collection-like API without implementing collection interfaces, keeping the builder surface area small while remaining expressive.
- **Version-Specific Notes:** Laravel 9+ added `through()` and `pipe()` to the proxy. Laravel 11+ improved IDE autocompletion for HOMs via `@mixin` annotations. The `reject()` method was added in Laravel 10.
