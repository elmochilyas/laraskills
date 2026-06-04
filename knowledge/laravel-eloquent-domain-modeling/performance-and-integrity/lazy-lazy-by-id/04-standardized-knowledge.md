# lazy / lazyById

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | lazy-lazy-by-id |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

`lazy()` and `lazyById()` bridge the gap between `chunk()` and `cursor()` by returning a `LazyCollection` — a memory-efficient, iterable stream that fetches results in batches without loading all rows at once. Unlike `chunk()`, `lazy()` provides a fluent, chainable API. Unlike `cursor()`, it supports eager loading and full Eloquent hydration.

## Core Concepts

- **`lazy($chunkSize)`**: Returns a `LazyCollection` fetching models in chunks. Supports eager loading, scopes, and constraints.
- **`lazyById($chunkSize, $column, $alias)`**: Key-based variant using `WHERE key > ?` pagination for mutation-safe iteration. Defaults to primary key.
- **`lazyByIdDesc($chunkSize, $column, $alias)`**: Same as `lazyById()` but descending order.
- **`LazyCollection`**: Fetches items on-demand during iteration rather than all at once. Implements `IteratorAggregate`.
- **Chaining support**: Supports `map`, `filter`, `reduce`, etc., processed lazily per chunk.

## When To Use

- Processing large datasets (100k+ rows) where memory must be bounded
- Iteration that needs eager-loaded relationships (use `lazy()` with `with()`)
- Mutation-safe iteration over live datasets (use `lazyById()`)
- Fluent collection-style processing on large datasets (map, filter, reduce pipelines)
- Replacement for most `chunk()` use cases — `lazy()` provides the same mechanics with a better API

## When NOT To Use

- Datasets small enough to fit in memory (use `get()` for simplicity)
- Memory is at absolute premium and eager loading is not needed (use `cursor()`)
- You need a simple callback-based approach without collection methods (use `chunk()`)
- The dataset is static and read-only, and you prefer `chunk()`'s simplicity

## Best Practices

- **Use `lazyById()` for concurrent scenarios by default**: `lazy()` has the same offset-drift problem as `chunk()` — inserts/deletes during iteration can skip or duplicate rows. `lazyById()` uses key-based pagination and is stable under mutation. Default to `lazyById()` unless the dataset is proven read-only.
- **Use `with()` before `lazy()` for relationships**: Unlike `cursor()`, `lazy()` respects eager loading. Load relationships before calling `lazy()` to avoid N+1 within each chunk: `User::with('profile')->lazy(100)`. Each chunk fetches its models and related profiles in one query per chunk.
- **Do not materialize the LazyCollection**: Calling `->toArray()`, `->all()`, or `->count()` on a `LazyCollection` forces all chunks into memory, defeating the purpose. Only iterate it with `foreach`, `->each()`, or lazy chain methods.
- **Size chunks appropriately**: Default 1000 is reasonable. Use smaller chunks (50–200) for models with many eager-loaded relationships. Use larger chunks (2000–5000) for simple models.

## Architecture Guidelines

- Place lazy iteration in CLI commands or queue jobs, not web requests
- Use `lazyById()` for production batch jobs on live tables
- Log starting/ending keys for `lazyById()` to support failure recovery
- Consider dispatching a job per chunk for time-sensitive processing

## Performance Considerations

- Memory usage is proportional to chunk size × model size — a chunk of 500 models with 5 relations may use 10–50 MB
- `lazy()` with eager loading executes one additional query per chunk per relation — for 100 chunks × 3 relations = 300 queries (far better than N+1)
- `lazyById()` is more efficient than `lazy()` for large datasets — avoids offset scan overhead
- `LazyCollection` pipeline processes items one chunk at a time; memory stays bounded by chunk size

## Security Considerations

- No direct security implications — lazy iteration is a memory management concern
- Ensure lazy-iterated data respects authorization boundaries

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Iterating a LazyCollection twice | Not knowing it's single-use | Generator rewind error | Re-create the query for second iteration |
| Calling `->all()` or `->toArray()` | Habit from regular collections | Full dataset loaded into memory | Only iterate with `foreach` or `->each()` |
| Expecting lazy relations to work | Confusing parent and child query strategies | N+1 on relationships | Use `with()` before `lazy()` |
| Not using `lazyById()` for live tables | Unaware of offset drift | Skipped/duplicate rows | Default to `lazyById()` |
| Using `lazy()` for tiny datasets | Over-engineering | Unnecessary complexity | Use `get()` for small result sets |

## Anti-Patterns

- **lazy-where-chunkById-is-needed**: Using `lazy()` for batch mutations on live tables. Offset drift causes incorrect processing. Use `lazyById()`.
- **Materialized lazy collection**: Calling a method that triggers full evaluation (`->count()`, `->toArray()`) on a `LazyCollection`. Only the final output needs materialization, the stream should stay lazy.
- **lazy-in-web-controller**: Using `lazy()` in a web request. While less dangerous than `cursor()` (chunks release connections), it still adds latency unpredictability.

## Examples

```php
// Memory-safe eager-loaded iteration
$users = User::with('profile', 'settings')->lazy(100);
foreach ($users as $user) {
    // $user->profile and $user->settings are already loaded
}

// Mutation-safe batch processing
User::lazyById(200)->each(function ($user) {
    $user->update(['processed_at' => now()]);
});

// Collection pipeline on large dataset
User::lazy(500)
    ->filter(fn($user) => $user->isActive())
    ->map(fn($user) => $user->email)
    ->each(fn($email) => Mail::to($email)->send($newsletter));

// Descending processing (newest first)
User::lazyByIdDesc(100)->each(function ($user) {
    Log::info("Processing user {$user->id} from newest to oldest");
});
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | chunk-chunk-by-id |
| Prerequisite | LazyCollection fundamentals |
| Closely Related | cursor |
| Closely Related | select-constraints |

## AI Agent Notes

- Generate `lazy()` by default for memory-safe iteration over large datasets (not `chunk()`)
- Add `with()` before `lazy()` when relationships are accessed in the loop
- Use `lazyById()` instead of `lazy()` for batch mutation jobs on live data
- Never generate materialization calls (`->toArray()`) on a `LazyCollection` variable

## Verification

- [ ] `lazyById()` is used for datasets that may be mutated during iteration (not `lazy()`)
- [ ] Eager loading (`with()`) is called before `lazy()` when relationships are accessed
- [ ] `LazyCollection` is not materialized via `->toArray()`, `->all()`, or `->count()`
- [ ] Chunk size is tuned for model complexity (smaller for heavy relations)
- [ ] Lazy iteration runs in CLI/queue context, not web request
