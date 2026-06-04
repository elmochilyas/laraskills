# Performance Tradeoffs

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Query Builder vs Eloquent performance tradeoffs center on model hydration overhead, relationship loading strategies, memory consumption, and query compilation cost. Eloquent adds measurable overhead per row (2-5µs for hydration, plus memory for model objects), making it significantly slower for large result sets. However, for typical web requests (fetching 1-50 records), the difference is negligible (microseconds). The critical performance trap is not hydration itself — it's N+1 queries from lazy loading, inefficient relationship queries, and unnecessary hydration in loops. Understanding these tradeoffs allows developers to profile effectively, optimize strategically, and avoid premature optimization.

## Core Concepts
- **Hydration Overhead** — CPU time to convert a database row to an Eloquent model (attribute casting, trait booting, event firing)
- **Memory Per Model** — each hydrated model carries an `$attributes` array, `$original` array, `$relations` array, and per-instance metadata
- **N+1 Query Cost** — lazy loading relationships in a loop produces N additional queries; the dominant cost in most Eloquent performance problems
- **Eager Loading vs Join** — `with('relation')` runs a separate query; `join` merges data in one query but may duplicate rows
- **Compilation Cost** — the time Eloquent spends building SQL from the builder chain (negligible for most queries)
- **Buffered vs Unbuffered Queries** — MySQL's buffered queries load all results into memory at fetch time; unbuffered (used by `cursor()`) streams results but holds the connection

## Mental Models
- **Cost Per Row** — think of hydration as a per-row tax. At 10 rows, the tax is ~50µs (invisible). At 10k rows, it's ~50ms (measurable). At 100k rows, it's ~500ms (significant).
- **N+1 as Hidden Cost** — Eloquent's convenience (lazy loading) hides performance costs. Every relationship access in a loop is a hidden database query.
- **Optimization Pyramid** — queries (first) → eager loading → hydration (last). Fix the number of queries before optimizing hydration.
- **Amdahl's Law Applied** — optimize what matters: if 90% of request time is spent in 2 queries, optimizing hydration on those 2 queries yields little benefit.

## Internal Mechanics
Breakdown of hydration cost (approximate, PHP 8.2+):

```
Row fetched from PDO:           ~0.1µs
Model instantiation:            ~0.5µs  (constructor, trait boot)
Attribute setting:              ~0.3µs  (per attribute, with casting)
Date casting:                   ~1.0µs  (per Carbon instance)
JSON casting:                   ~0.5µs  (per json_decode)
Accessor call (first access):   ~2.0µs  (method resolution + computation)
retrieved event dispatch:       ~0.5µs  (event dispatcher overhead)
------
Total per model (no accessors): ~2-3µs
Total per model (with casts):   ~3-5µs
```

Memory per hydrated model: approximately 2-4KB (depending on attribute count, relationship data, casting)

For Query Builder + `toBase()`: ~0.5µs per row, ~0.5KB per row — about 4-10x less memory and 5-10x less CPU.

## Patterns
- **Profile First** — never optimize Eloquent performance without profiling. Use Laravel Debugbar, Telescope, or clockwork to identify actual bottlenecks.
- **Use `toBase()` for Read Models** — when you need model-like queries but not model features, `toBase()` is the safest optimization.
- **Chunk Large Result Sets** — `chunk(100)` or `chunkById(100)` for memory-safe batch processing of large datasets.
- **Eager Load Strategically** — use `with()` for relationships needed on every result; use `load()` for conditional relationship loading.
- **Select Only Needed Columns** — `select(['id', 'name'])` reduces hydration overhead and data transfer.
- **Use `cursor()` for Iteration** — `cursor()` yields models one at a time without loading all into memory (but uses unbuffered queries).

## Architectural Decisions
- **When to Optimize Hydration** — only after confirming hydration is the bottleneck. Hydration is rarely the dominant cost in a typical web request (I/O dominates).
- **When to Use Query Builder** — for reporting, exports, batch processing, or any path where event/cast/relationship features are unused.
- **When to Accept Eloquent Overhead** — for standard CRUD, API resources, form model binding, and any path where model features save developer time.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Eloquent: 5-10x faster development for CRUD | 2-5µs per row overhead | Negligible for <100 rows; significant for bulk |
| Eloquent: relationship lazy loading saves initial query cost | N+1 risk in loops | Always eager-load in list/show endpoints |
| Eloquent: `with()` keeps queries separate (no row duplication) | 2 queries instead of 1 for joined data | Row duplication from joins often costs more than the extra query |
| Query Builder: minimal overhead (0.5µs/row) | No relationships, scopes, events | Use for bulk reads; avoid for domain logic |
| `toBase()`: Eloquent builder + QB results | Mixed abstraction level | Best compromise for read-heavy paths |
|  |  |  |

## Performance Considerations
- **N+1 is the #1 performance problem in Eloquent** — one lazy-loaded relationship in a loop can generate 100+ hidden queries. Use `Model::preventLazyLoading()` in development.
- **Eager loading is not free** — `with('posts.comments')` generates two additional queries. On very large result sets, consider joins or subqueries.
- **Join row duplication** — `JOIN` on a one-to-many relationship duplicates parent rows. Hydration then deduplicates based on the parent ID. For large results, this duplicates data transfer.
- **`cursor()` vs `chunk()`** — `cursor()` uses unbuffered queries (single PDO statement, streaming); `chunk()` uses buffered queries (multiple `LIMIT` queries). `chunk()` is better for long-running processes because it doesn't hold the connection open.
- **`chunkById()` stability** — uses `ORDER BY id` with offset pagination; immune to row insertion shifting (unlike offset pagination).

## Production Considerations
- **Enable lazy loading prevention** — `Model::preventLazyLoading()` in local/dev; `Model::handleLazyLoadingViolationUsing()` in production to log violations
- **Set slow query thresholds** — configure `DB::listen()` with a duration threshold; log queries that exceed 100ms (database time, not PHP time)
- **Use `explain()` on hot queries** — `$query->explain()` returns the query plan; check for full table scans, missing indexes
- **Monitor memory** — streaming endpoints and queue jobs handling large datasets should use `cursor()` or `chunk()` to stay under PHP memory limits
- **Cache if possible** — if a query runs on every page load, consider caching the result (even with Eloquent) to eliminate the database round trip entirely

## Common Mistakes
- **Optimizing hydration before queries** — fixing hydration overhead saves 2-5µs/row; fixing N+1 saves N queries. Always fix N+1 first.
- **Using `get()` for large result sets** — fetching 100k rows with `get()` causes memory exhaustion. Use `cursor()` or `chunk()`.
- **Assuming `toBase()` is always faster** — if the result set is small (1-10 rows), `toBase()` savings are negligible. Readability matters more.
- **Forgetting that `toBase()` skips scopes** — if a global scope filters tenant data, `toBase()` may return unpartitioned results.
- **Over-using `with()`** — eager loading relationships that are used on only 5% of results wastes the eager-load query. Use `load()` conditionally.

## Failure Modes
- **Memory exhaustion on export** — exporting 500k records with `Model::all()` consumes >2GB memory. Always use `chunk()` or `lazy()` for exports.
- **Connection saturation with `cursor()`** — a `cursor()` loop that processes 1M records ties up a single connection for minutes; other processes queue up waiting for connections.
- **Deadlocks from long transactions** — iterating over results with `chunk()` inside a transaction holds locks across multiple queries, risking deadlock.
- **Buffer overflow with buffered queries** — `get()` on a 200MB result set tries to allocate 200MB+ in PHP memory; crashes the process.

## Ecosystem Usage
- **Laravel Debugbar** — shows query count, time, and duplicate queries
- **Laravel Telescope** — `Queries` tab shows all queries with bindings, duration, and caller stack traces
- **Clockwork** — browser extension for profiling queries, including hydration, model events, and collection processing
- **Laravel Prometheus Exporter** — export query duration and count metrics to monitoring systems
- **Laravel Performance Profiling (spatie/laravel-metrics)** — collect and aggregate performance data

## Related Knowledge Units

### Prerequisites
Builder Fundamentals, Decision Framework

### Related Topics
To Base Pattern, Hybrid Strategies, Higher Order Messages

### Advanced Follow-up Topics
Custom Builder Pattern, Domain-Specific Query Methods, Global Scope Suppression

## Research Notes
- **Source Analysis:** Performance characteristics from benchmark tests (https://github.com/abenevaut/laravel-eloquent-benchmarks) and first-principles analysis of `Illuminate\Database\Eloquent\Model` constructor.
- **Key Insight:** The single biggest performance gain in Eloquent is not hydration optimization — it's reducing query count through eager loading and avoiding lazy loading. A 2-query solution with `with()` is almost always faster than a 1-query solution with a massive join that multiplies rows 100x.
- **Version-Specific Notes:** PHP 8.1+ JIT improves hydration performance by ~20-30% by optimizing model constructor paths. Laravel 10+ reduced hydration overhead by ~15% through attribute-setter optimization. Laravel 11 introduced `Model::preventLazyLoading()` as a framework concern.
