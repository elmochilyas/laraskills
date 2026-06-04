# Performance Tradeoffs — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Performance Tradeoffs
- **ECC Version:** 1.0

## Overview
Eloquent adds measurable overhead per row (2-5µs hydration, 2-4KB memory) compared to Query Builder (0.5µs, 0.5KB). However, for typical web requests (1-50 records), the difference is negligible. The critical performance trap is not hydration — it's N+1 queries from lazy loading, inefficient relationship queries, and unnecessary hydration in loops. This knowledge unit provides the cost model for making informed optimization decisions.

## Core Concepts
- Hydration Overhead: CPU time converting rows to models (attribute casting, trait booting, event firing)
- Memory Per Model: ~2-4KB per hydrated model (`$attributes`, `$original`, `$relations`, metadata)
- N+1 Query Cost: lazy loading relationships in a loop — the dominant Eloquent performance problem
- Eager Loading vs Join: `with()` runs separate queries; `join` merges data but may duplicate rows
- Buffered vs Unbuffered: MySQL buffered queries load all results at fetch time; unbuffered (cursor) streams
- Compilation Cost: time building SQL from the builder chain — negligible for most queries

## When To Use
- Profile first — never optimize Eloquent without profiling data (Debugbar, Telescope, Clockwork)
- Use `toBase()` for read models when hydration is confirmed as a bottleneck
- Use `chunk()` or `chunkById()` for memory-safe batch processing of large datasets
- Use `cursor()` for streaming iteration without loading all results into memory
- Select only needed columns: `select(['id', 'name'])` to reduce hydration and transfer overhead

## When NOT To Use
- Do NOT optimize hydration before fixing N+1 — N+1 is almost always the bigger problem
- Do NOT use `toBase()` on result sets < 100 rows — savings are negligible; readability matters more
- Do NOT use `cursor()` inside long-running transactions — the open cursor holds locks
- Do NOT use `get()` for result sets > 10,000 rows — risk of memory exhaustion
- Do NOT over-use `with()` — eager loading relationships used on only 5% of results wastes queries

## Best Practices (WHY)
- Fix N+1 before optimizing hydration: fixing N+1 saves N queries; optimizing hydration saves 2-5µs/row
- Use `Model::preventLazyLoading()` in development to catch N+1 early
- Eager-load relationships needed on every result; use `load()` for conditional loading
- Use `chunkById()` for stable pagination — immune to row insertion shifting
- Configure `DB::listen()` with a duration threshold to log slow queries in production
- Cache query results when the same data is requested repeatedly

## Architecture Guidelines
- Set query count budgets per request (e.g., "no more than 10 queries on list endpoints")
- Write performance regression tests for critical query paths
- Use `explain()` on hot queries to verify index usage
- Monitor memory usage for endpoints that stream or export large datasets
- Separate read-heavy paths (reporting, exports) from write-heavy paths in the codebase

## Performance
- Hydration: ~2-5µs per model; toBase: ~0.5µs per row — 5-10x difference
- Memory: ~2-4KB per model vs ~0.5KB per stdClass — 4-10x difference
- N+1: one lazy-loaded relationship in a loop of 100 items = 101 queries instead of 2
- Eager loading: `with('posts.comments')` generates 2 additional queries regardless of result count
- Join row duplication: JOIN on one-to-many duplicates parent rows; hydration deduplicates
- `cursor()` vs `chunk()`: cursor uses unbuffered queries (streaming); chunk uses buffered (LIMIT queries)

## Security
- Memory exhaustion from unbounded `get()` can crash the PHP process — always paginate or chunk
- Long-running `cursor()` iterations hold database connections — can starve the connection pool
- Caching query results can expose stale data if cache invalidation is not correct
- `explain()` output may expose schema structure — restrict in production

## Common Mistakes
- Optimizing hydration before fixing N+1 — hydrating 100 rows is ~0.5ms; N+1 adds 100 queries
- Using `get()` for large result sets — causes memory exhaustion
- Assuming `toBase()` is always faster — savings on 1-10 rows is ~20-50µs, invisible to users
- Forgetting `toBase()` skips scopes — may return unpartitioned data in multi-tenant apps
- Over-using `with()` — eager loading relationships used on 5% of results wastes the query
- Using `get()->each->update()` instead of single `update()` — hydrates every row unnecessarily

## Anti-Patterns
- **N+1 in Disguise**: calling relationships inside `each()` or `map()` callbacks without eager loading
- **Massive Get**: `Model::all()` or `Model::get()` on tables with 100k+ rows
- **Get Then Update**: fetching all records with `get()` then updating each one in a loop
- **Ignored Profile Data**: never profiling, then guessing about performance bottlenecks
- **Chunk Over Cursor for Streaming**: using `chunk()` when `cursor()` is more appropriate for streaming

## Examples
```php
// Profile first
DB::listen(fn($q) => Log::info($q->sql, $q->bindings));

// Fix N+1: eager load
$users = User::with('posts')->get(); // 2 queries

// Instead of:
// $users = User::get(); // 1 query
// foreach ($users as $user) {
//     $user->posts; // N+1: 1 query per user
// }

// Memory-safe batch
User::where('active', true)->chunkById(100, function ($users) {
    foreach ($users as $user) {
        // process without loading all into memory
    }
});

// Select only needed columns
User::select('id', 'name', 'email')->where('active', true)->get();

// Cache frequent queries
$users = Cache::remember('active_users', 3600, fn() =>
    User::where('active', true)->with('profile')->get()
);
```

## Related Topics
- Decision Framework — when to use Eloquent vs Query Builder
- To Base Pattern — `toBase()` as the first optimization step
- Hybrid Strategies — combining Eloquent construction with QB execution
- Higher Order Messages — memory-efficient iteration patterns

## AI Agent Notes
- Always check for N+1 first when generating Eloquent code that iterates results
- Prefer `with()` for relationships needed on every item; use `load()` for conditional loading
- Use `chunkById()` for batch processing, not `get()->each()`
- Profile before optimizing — don't assume hydration is the bottleneck
- Use `select()` to limit columns when not all fields are needed

## Verification
- [ ] N+1 prevention active (`preventLazyLoading()` in development)
- [ ] All list/show endpoints have eager-loaded relationships
- [ ] No `get()` calls on result sets exceeding 10,000 rows
- [ ] Slow query threshold configured and monitored
- [ ] Caching strategy verified with correct invalidation
- [ ] `explain()` plans checked for hot queries
- [ ] Memory limits tested for streaming/export endpoints
