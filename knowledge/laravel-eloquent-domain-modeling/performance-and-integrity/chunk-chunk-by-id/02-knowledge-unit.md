# chunk vs chunkById — Mutation-Safe Chunking

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Performance & Data Integrity
- **Knowledge Unit:** chunk-chunk-by-id
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

`chunk()` and `chunkById()` are memory-efficient iteration methods that process large result sets in batches instead of loading all rows at once. `chunk()` uses offset-based pagination internally, while `chunkById()` uses key-based pagination. The critical difference is mutation safety: `chunk()` can miss or duplicate rows when the dataset changes during iteration, whereas `chunkById()` is stable under mutation because it paginates by a monotonically increasing key.

---

## Core Concepts

- **`chunk($count, $callback)`:** Fetches `$count` rows at a time using `LIMIT $count OFFSET $n`. The callback receives a `Collection` of models.
- **`chunkById($count, $callback, $column, $alias)`:** Fetches `$count` rows using `WHERE id > $lastId LIMIT $count`. The `$column` defaults to the model's primary key.
- **Offset drift problem:** If rows are inserted or deleted during `chunk()` iteration, the offset shifts — rows may be skipped or processed twice.
- **Key-based stability:** `chunkById()` tracks the last processed key value. New or deleted rows before that key do not affect subsequent batches.
- **Memory profile:** Both methods stream results via the query builder — only one chunk's worth of models is ever in memory.

---

## Mental Models

### The Scroll vs. The Bookmark
`chunk()` is like scrolling through a list — your position is measured from the top (offset). If items are added or removed above your view, the content shifts. `chunkById()` is like a bookmark on a specific page — you always pick up from the last page number, regardless of what was inserted or removed before it.

### The Escalator vs. The Stairs
Offset pagination (chunk) is an escalator — stepping onto it while people are moving changes your effective position. Key-based pagination (chunkById) is stairs — you always know exactly which step you're on.

---

## Internal Mechanics

- `chunk()` executes: `SELECT * FROM table ORDER BY primary_key ASC LIMIT $count OFFSET $offset`.
- `chunkById()` executes: `SELECT * FROM table WHERE id > $lastId ORDER BY id ASC LIMIT $count`.
- `chunk()` uses `Query\Builder::forPage($page, $count)` internally.
- `chunkById()` uses `Query\Builder::forPageAfterId($count, $lastId)`.
- Both return `true` from the callback to continue iteration, or `false` to stop early.

---

## Patterns

- **Bulk updates on large tables:** `chunkById()` for safe iteration when rows may be modified:
```php
User::chunkById(100, fn($users) => $users->each->update(['processed' => true]));
```
- **Data export:** `chunk()` for read-only exports where mutation is not a concern.
- **Migration/backfill:** `chunkById()` with ordering to process records in batches without skipping.
- **Nested chunking:** Process related data per chunk: within each chunk, query child relationships.
- **Early termination:** Return `false` from the callback to stop processing after a condition is met.

---

## Architectural Decisions

- **Default chunking method:** Prefer `chunkById()` when the dataset may be mutated during processing (queues, long-running jobs, user-facing batch operations). Use `chunk()` for read-only exports or reports where speed outranks safety.
- **Custom key column:** For tables with non-incrementing primary keys (UUIDs, ULIDs), pass the appropriate `$column` and `$alias` to `chunkById()`.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| `chunkById()` is mutation-safe | Requires a monotonically incrementing key | Fails with UUID keys without explicit `$column` |
| `chunk()` is simpler to understand | Offset drift causes missed/duplicate rows | Only use for read-only operations |
| Both are memory-efficient | Each chunk is a separate query | N queries for N chunks — query log gets noisy |
| Early termination support | Callback must return explicit boolean | Forgetting `return false` continues iteration |

---

## Performance Considerations

- Each chunk executes a separate query with `ORDER BY primary_key`. On large tables, sorting overhead grows with offset for `chunk()` but stays constant for `chunkById()`.
- `chunkById()` leverages the primary key index for the `WHERE id > ?` clause — constant-time lookups regardless of the page number.
- `chunk()` with large offsets degrades: `OFFSET 100000 LIMIT 100` still scans 100,100 rows before returning 100. This is a well-known MySQL/PostgreSQL limitation.
- Batch size tuning: smaller batches (100–500) reduce per-query memory but increase query count. Larger batches (1000–5000) reduce round trips but increase memory per chunk.

---

## Production Considerations

- Wrap `chunkById()` processing in a job that can resume from failure. Store the last processed ID in a cache key or database checkpoint.
- Monitor chunk iteration time — if a single chunk takes too long due to slow joins or complex constraints, reduce chunk size.
- For very large tables (millions of rows), `chunkById()` over the primary key is the only safe approach. Avoid `chunk()` entirely.
- Use `DB::transaction()` inside the callback to ensure each chunk's mutations are atomic and roll back cleanly on failure.

---

## Common Mistakes

- **Using `chunk()` for destructive operations:** Deleting rows while iterating with `chunk()` shifts offsets — rows are missed. Always use `chunkById()` for deletes.
- **Not ordering explicitly:** Both methods default to primary key ordering. If a custom `orderBy` is applied, the chunking behavior breaks. Use `chunkById()` for custom ordered batches.
- **Modifying the key column:** If `chunkById()` iterates on `id` but the callback changes `id` values, the next batch's `WHERE id > ?` may skip or miss rows.
- **Chunking on non-indexed columns:** `chunkById()` requires an index on the key column. Without it, the `WHERE id > ?` clause performs a full scan per chunk.

---

## Failure Modes

- **Chunk drift with `chunk()` on active table:** During a long-running job, insertions shift offsets forward — some rows are processed twice. Deletions shift offsets backward — some rows are skipped.
- **Integer overflow:** For tables with >2^31 rows using signed integer primary keys, the last processed ID may approach the maximum. Monitor and consider migrating to bigInteger.
- **Callback exception leaves partial state:** If the callback throws after processing some rows in the chunk, the batch is partially applied. Wrap the callback in a transaction.
- **Empty chunk infinite loop:** If all rows in the table have been deleted during iteration, `chunkById()` may get stuck if the last processed ID exceeds the max existing ID. This is mitigated in Laravel by checking `$results->isEmpty()`.

---

## Ecosystem Usage

- **Laravel Queues:** Batch processing jobs use `chunkById()` internally for safe job dispatch on large datasets.
- **Laravel Nova Actions:** "Execute Action" on all matching resources uses chunked queries when processing large result sets.
- **Laravel Scout:** Import commands chunk documents when syncing to search engines.

---

## Related Knowledge Units

### Prerequisites
- Query builder fundamentals (`LIMIT`, `OFFSET`, `WHERE`)
- Eloquent model querying basics

### Related Topics
- `lazy-lazy-by-id` (cursor-based lazy collections, similar key-based approach)
- `cursor` (single-query streaming alternative)
- `subquery-optimization` (alternative approaches for large dataset processing)

### Advanced Follow-up Topics
- Database-specific chunking behavior (MySQL vs PostgreSQL vs SQLite vs SQL Server)
- Custom chunking implementations for multi-key pagination

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Builder::chunk()` and `Illuminate\Database\Eloquent\Builder::chunkById()` at `src/Illuminate/Database/Eloquent/Builder.php`. Both delegate to `Illuminate\Database\Query\Builder` methods. `chunkById()` calls `forPageAfterId()` which uses `where` and `limit`.

### Key Insight
The choice between `chunk()` and `chunkById()` is fundamentally a concurrency concern, not a performance concern. `chunkById()` is not faster — it is safer. The performance of `chunkById()` degrades less on large offsets, but that is a secondary benefit.

### Version-Specific Notes
- Laravel 5+: Both methods available.
- Laravel 8+: `chunkById()` supports custom `$alias` parameter for joined queries.
- Laravel 9+: Performance optimizations in `forPageAfterId()` for better index utilization.
- Laravel 10+: `chunkById()` on `BelongsToMany` relationships improved for pivot table pagination.
