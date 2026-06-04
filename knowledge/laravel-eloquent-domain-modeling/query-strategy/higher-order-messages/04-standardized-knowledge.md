# Higher Order Messages — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Higher Order Messages
- **ECC Version:** 1.0

## Overview
Higher Order Messages (HOMs) on Eloquent Builder enable collection-like iteration — `each()`, `map()`, `filter()`, `reject()`, `tap()`, `pipe()` — directly on the builder before execution. They are implemented via a `HigherOrderBuilderProxy` that intercepts method calls and defers them to collection results. HOMs bridge query construction and result processing in a fluent pipeline.

## Core Concepts
- `HigherOrderBuilderProxy` — intercepts calls to collection methods on the builder
- `each()` — lazy iteration via `cursor()`; processes one record at a time
- `map()` — transforms results via callback; loads all results via `get()`
- `filter()` — post-query predicate filtering
- `reject()` — inverse of filter
- `tap()` — pass-through for side effects; returns the collection unchanged
- `pipe()` — passes collection through a transforming function
- `first()` — HOM version returns first matching record after predicate

## When To Use
- `each()` for batch processing of large datasets (sending emails, updating records)
- `filter()` for permission-based or computed-field filtering that can't be done in SQL
- `map()` for lightweight transformations on small-to-medium result sets
- `tap()` for logging or monitoring mid-chain without affecting results
- `pipe()` for grouping, reducing, or reshaping result collections

## When NOT To Use
- Do NOT use `map()` or `filter()` for large datasets — they load all results into memory
- Do NOT use `each()` for simple iteration when you need to chain further collection methods
- Do NOT use HOMs when a SQL `WHERE` clause can express the filter — push filtering to the database
- Do NOT lazy-load relationships inside `each()` callbacks — eager-load before the HOM
- Do NOT use HOMs for side effects that modify the query source during iteration

## Best Practices (WHY)
- Eager-load relationships before HOMs to avoid N+1: `->with('posts')->each(...)`
- Use `each()` for memory-safe iteration over large results (backed by `cursor()`)
- Confine HOM chains to 2-3 methods; longer chains should extract intermediate steps to variables
- Use `tap()` for logging/debugging without affecting the collection pipeline
- Prefer SQL filtering over `filter()` HOM — database filtering is faster and more memory-efficient

## Architecture Guidelines
- Keep HOM callbacks simple (1-3 lines); extract complex logic to named methods or classes
- Use `pipe()` to encapsulate complex collection transformations in testable units
- Document when HOMs are used for memory optimization vs convenience
- Avoid HOM chains that mix query construction and result transformation in the same expression

## Performance
- `each()` uses `cursor()` — memory-efficient, one row at a time via generator
- `map()` and `filter()` call `get()` — load all results into memory; use with known-small sets
- `cursor()` uses unbuffered queries (MySQL) — connection stays busy until iteration finishes
- `chunk()` vs `each()` — `chunk()` fetches in pages (default 100); can be faster for some databases
- N+1 risk inside callbacks — eager-load before the HOM

## Security
- Avoid expensive I/O inside callbacks that could be exploited for timing attacks
- Ensure callbacks do not expose sensitive data through logging or error messages
- Validate user input used inside HOM callbacks
- Be cautious with `pipe()` — the transformation function could modify or expose data

## Common Mistakes
- Loading relationships inside `each()` — triggers N+1: `->each(fn($u) => $u->posts->count())`
- Using `map()` for huge datasets — loads all results into memory, causing OOM
- Confusing `first()` HOM with builder `first()` — HOM `first()` returns first result after a predicate
- Assuming `each()` returns a collection — it returns `void`; use `each()` for side effects only
- Calling `get()` before HOMs — HOMs already call `get()` (or `cursor()`) internally

## Anti-Patterns
- **Map for Large Sets**: using `map()` on 100k+ records — use `cursor()` + manual iteration
- **Hidden N+1**: calling relationships inside `each()` or `filter()` callbacks
- **Side Effect in Filter**: performing writes or I/O inside `filter()` predicate
- **Unbounded Cursor**: long-running `each()` without progress tracking or timeout
- **HOM Over SQL**: using `filter()` HOM when a `WHERE` clause could express the condition

## Examples
```php
// Batch processing with each()
User::where('verified', false)
    ->with('profile')
    ->each(fn(User $user) => $user->sendVerificationEmail());

// Logging with tap()
$posts = Post::published()
    ->tap(fn($c) => Log::info('Processing ' . $c->count() . ' published posts'))
    ->each(fn($p) => $p->sendToNewsletter());

// Transformation with pipe()
$grouped = User::active()
    ->pipe(fn($c) => $c->groupBy('department_id'));

// Filter by computed condition
$eligible = User::where('active', true)
    ->filter(fn($u) => $u->hasPermission('discount'))
    ->map(fn($u) => ['id' => $u->id, 'name' => $u->name]);
```

## Related Topics
- Builder Fundamentals — terminal methods and query execution
- Performance Tradeoffs — `chunk()` vs `cursor()` vs `each()` for large datasets
- To Base Pattern — using `toBase()` + `cursor()` for memory-efficient raw iteration
- Hybrid Strategies — combining HOMs with Query Builder for optimal patterns

## AI Agent Notes
- Use `each()` for side effects (updates, emails, logging) — it returns void
- Use `map()` only when the result set is known to be small
- Always eager-load with `with()` before HOMs to avoid N+1
- Remember that `cursor()` holds the connection — avoid long-running iterations
- Verify HOM chain behavior with small datasets before running on production data

## Verification
- [ ] `map()` and `filter()` only used for small result sets (< 1000 records)
- [ ] Relationships eager-loaded before HOM chains
- [ ] `each()` callbacks do not modify the query source during iteration
- [ ] Connection not saturated by long-running `cursor()` iterations
- [ ] No N+1 queries from lazy loading inside HOM callbacks
- [ ] HOM chains are tested with both empty and populated result sets
