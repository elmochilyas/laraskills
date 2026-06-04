# lazy / lazyById — Lazy Collection Streaming

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** lazy-lazy-by-id
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

`lazy()` and `lazyById()` bridge the gap between `chunk()` and `cursor()` by returning a `LazyCollection` — a memory-efficient, iterable stream that fetches results in batches without loading all rows at once. Unlike `chunk()`, which requires a callback, `lazy()` provides a fluent, chainable interface compatible with collection operations. Unlike `cursor()`, it supports eager loading and relationship hydration. This makes `lazy()` the preferred method for memory-safe iteration when you need full Eloquent model hydration with relationship support.

---

## Core Concepts

- **`lazy($chunkSize)`:** Returns a `LazyCollection` that fetches models in chunks of `$chunkSize`, hydrating each chunk as a full Eloquent collection. Supports eager loading, scopes, and constraints.
- **`lazyById($chunkSize, $column, $alias)`:** Key-based variant equivalent to `chunkById()`. Uses `WHERE key > ?` pagination for mutation-safe iteration. Defaults to primary key.
- **`lazyByIdDesc($chunkSize, $column, $alias)`:** Same as `lazyById()` but processes in descending order.
- **`LazyCollection`:** A Laravel collection that fetches its items lazily — items are retrieved on-demand during iteration rather than all at once. Implements PHP's `IteratorAggregate`.
- **Chaining support:** `LazyCollection` supports most collection methods (`map`, `filter`, `reduce`, etc.) but processes them lazily.

---

## Mental Models

### The Streaming Video vs. Downloading Analogy
`lazy()` is like streaming a video — you download the first chunk and watch it while the next chunk downloads in the background. `get()` is like downloading the entire movie before watching. `cursor()` is like a live broadcast — you see frames as they arrive but can't pause, rewind, or add overlays (eager loading).

### The Conveyor Belt
Think of `lazy()` as a conveyor belt carrying bins of parts (Eloquent models). Each bin arrives one at a time. You can inspect, modify, or discard items as they pass, but you never have all items in front of you at once.

---

## Internal Mechanics

- `lazy()` calls `chunk()` internally but yields each chunk as an `Enumerable` item in a `LazyCollection`.
- The `LazyCollection` wraps PHP's generator functions. Each `yield` returns a chunk's worth of models.
- Eager loading works because each chunk is a fully hydrated Eloquent collection — `with('relation')` executes one query per chunk, not per row.
- The lazy collection is single-use: once iterated, it cannot be re-iterated unless re-created from the query builder.

---

## Patterns

- **Memory-safe model streaming:**
```php
$users = User::with('profile')->lazy(100);
foreach ($users as $user) {
    // Process $user with profile loaded — only 100 users in memory at a time
}
```
- **Collection pipeline on large datasets:**
```php
User::lazy(500)
    ->filter(fn($user) => $user->isActive())
    ->map(fn($user) => $user->email)
    ->each(fn($email) => Mail::to($email)->send($newsletter));
```
- **Processing with progress tracking:** Combine with `->each()` and a progress counter to track batch processing.
- **Safe iteration with mutation:** `lazyById()` for datasets being updated concurrently during iteration.

---

## Architectural Decisions

- **`lazy()` vs `chunk()` vs `cursor()`:** `lazy()` offers the best balance of memory efficiency and Eloquent features. Prefer `lazy()` for most large dataset iteration. Use `cursor()` only when memory is extremely constrained and eager loading is not needed. Use `chunk()` when callback-based processing is clearer than collection chaining.
- **Chunk size tuning:** Default chunk size of 1000 is reasonable for most use cases. Smaller sizes (50–200) for models with many eager-loaded relationships. Larger sizes (2000–5000) for simple models with minimal overhead.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Full Eloquent hydration with lazy memory | Each chunk executes a separate query | N+1 queries for N chunks — acceptable for large datasets |
| Eager loading works per chunk | Lazy collection is single-use | Cannot iterate twice without re-querying |
| Fluent chainable API (map, filter, reduce) | Slightly more overhead than `cursor()` | ~10-20% slower due to model hydration |
| `lazyById()` for mutation safety | Requires key column; degrades with non-indexed keys | Always index the key column used for pagination |

---

## Performance Considerations

- Memory usage is proportional to chunk size × model size. A chunk of 500 models with 5 eager-loaded relationships may use 10–50 MB. Adjust chunk size accordingly.
- `lazy()` with eager loading executes one additional query per chunk per relation. For 100 chunks × 3 relations = 300 queries. This is efficient compared to N+1 (100k queries) but should still be monitored.
- The `LazyCollection` pipeline processes items one chunk at a time. `filter()` on a `LazyCollection` applies the filter per chunk, but retains only matching items. Memory is still bounded by chunk size.
- Pagination with `lazyById()` is more efficient than `lazy()` for large datasets because it avoids the offset scan overhead.

---

## Production Considerations

- Use `lazyById()` for production jobs that process records while the application is live and inserts/deletes are happening.
- Monitor job runtime — if a single chunk's processing takes too long, the database connection may time out or the job may hit the execution limit.
- Log the starting and ending key for each `lazyById()` run to enable recovery from failure.
- For very time-sensitive processing, consider dispatching a job per chunk rather than processing all chunks sequentially.

---

## Common Mistakes

- **Using `lazy()` and iterating twice:** `LazyCollection` is single-use. Assign to a variable and re-create the query if you need to iterate again.
- **Calling `->all()` or `->toArray()` on a `LazyCollection`:** This forces full materialization into memory, defeating the purpose of lazy loading.
- **Expecting lazy relations to work:** `lazy()` affects the *parent* query only. Child relationships accessed via dynamic properties still lazy-load unless eager-loaded with `with()`.
- **Not using `lazyById()` for concurrent scenarios:** Using `lazy()` on a table with active inserts can skip or duplicate rows — same problem as `chunk()`.

---

## Failure Modes

- **Memory spike from lazy collection materialization:** Calling a method that triggers full collection evaluation (`->count()`, `->sum()`, `->toArray()`) forces all chunks to be loaded into memory.
- **Database connection timeout:** Long-running `lazy()` iteration holds the database connection open for the duration. If processing time exceeds `wait_timeout`, the connection drops mid-iteration.
- **Generator rewind error:** Attempting to re-iterate a `LazyCollection` that has been consumed throws a `Cannot rewind a generator that was already run` error.

---

## Ecosystem Usage

- **Laravel Excel (maatwebsite/Laravel-Excel):** Uses lazy collections internally for memory-safe spreadsheet exports.
- **Laravel Scout:** Import commands leverage lazy iteration for batch-importing models into search indexes.
- **Spatie's laravel-medialibrary:** Lazy processes media conversions on large collections to avoid memory exhaustion.

---

## Related Knowledge Units

### Prerequisites
- Eloquent collection basics
- PHP generators and iteration
- Chunking concepts (`chunk`, `chunkById`)

### Related Topics
- `chunk-chunk-by-id` (callback-based alternative)
- `cursor` (single-query streaming alternative)
- `select-constraints` (reducing per-model payload)

### Advanced Follow-up Topics
- Custom lazy collection implementations
- Reactive streams with lazy collections and RxPHP

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Builder::lazy()` at `src/Illuminate/Database/Eloquent/Builder.php`. The method wraps `chunk()` with a `LazyCollection`. `LazyCollection` is defined in `Illuminate\Support\LazyCollection` and implements PHP's `IteratorAggregate` interface.

### Key Insight
`lazy()` is the recommended replacement for most `chunk()` use cases because it provides a fluent, chainable API without the callback indirection. The underlying mechanics are identical to `chunk()` — the difference is interface, not implementation.

### Version-Specific Notes
- Laravel 7: `LazyCollection` introduced.
- Laravel 8: `lazy()` and `lazyById()` added to Eloquent builder.
- Laravel 9: `lazyByIdDesc()` added.
- Laravel 10+: Performance improvements in lazy collection chunk hydration.
