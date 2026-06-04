# chunk vs chunkById

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | chunk-chunk-by-id |
| Classification | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

`chunk()` and `chunkById()` are memory-efficient iteration methods that process large result sets in batches. `chunk()` uses offset-based pagination while `chunkById()` uses key-based pagination. The critical difference is mutation safety: `chunk()` can miss or duplicate rows when the dataset changes during iteration, whereas `chunkById()` is stable under mutation because it paginates by a monotonically increasing key.

## Core Concepts

- **`chunk($count, $callback)`**: Fetches `$count` rows using `LIMIT $count OFFSET $n`. The callback receives a Collection of models.
- **`chunkById($count, $callback, $column, $alias)`**: Fetches `$count` rows using `WHERE id > $lastId LIMIT $count`. Defaults to the primary key.
- **Offset drift problem**: Insertions or deletions during `chunk()` iteration shift the offset — rows may be skipped or processed twice.
- **Key-based stability**: `chunkById()` tracks the last key. New or deleted rows before that key do not affect subsequent batches.
- **Memory profile**: Only one chunk's worth of models is ever in memory.

## When To Use

- Processing large tables (100k+ rows) where loading all rows into memory is infeasible
- Long-running batch jobs that must not exhaust memory
- Migration or backfill scripts operating on production-sized datasets
- Data export to files (CSV, JSON) from large tables

## When NOT To Use

- Result sets are small enough to fit in memory (use `get()`)
- You need eager-loaded relationships on each row (use `lazy()` with `with()`)
- The table has no monotonically incrementing key and you cannot supply one
- You are using `chunk()` on a table actively being written to (use `chunkById()`)

## Best Practices

- **Always use `chunkById()` for destructive operations**: Deletions during `chunk()` shift offsets causing missed rows. `chunkById()` is stable under mutation because it paginates by key, not position. A delete of row 10 during `chunk(10)` means the next query with `OFFSET 10` starts at what was row 11, skipping it entirely.
- **Wrap callback in a transaction**: If the callback throws mid-batch, partial changes are committed. Wrapping in `DB::transaction()` ensures each chunk processes atomically.
- **Store checkpoints for resumability**: Save the last processed ID to a cache key or database column. If the job fails, resume from the checkpoint instead of re-processing from the beginning.
- **Order explicitly**: Both methods default to primary key ordering. Applying a custom `orderBy` breaks the chunking assumption. Use `chunkById()` with the appropriate key column for custom-ordered batches.

## Architecture Guidelines

- Place chunked processing in a queue job or artisan command, never in a web request
- Pass the last processed ID as a job parameter to support resumability
- Set batch size between 100 and 1000 — smaller batches reduce per-query memory but increase query count
- Use `chunkById()` over `chunk()` by default unless the dataset is proven read-only

## Performance Considerations

- `chunkById()` leverages the primary key index for `WHERE id > ?` — constant-time lookups regardless of page number
- `chunk()` with large offsets degrades: `OFFSET 100000 LIMIT 100` still scans 100,100 rows
- Each chunk is a separate query — N chunks produce N queries. Monitor query volume in production.
- Batch size tuning: smaller batches (100–500) reduce per-query memory but increase round trips; larger batches (1000–5000) reduce queries but increase memory per chunk

## Security Considerations

- No direct security implications — chunking is a memory management strategy
- Ensure exported data respects authorization boundaries (do not chunk-export data the user should not see)

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using `chunk()` for deleting rows | Familiarity with chunk before understanding key-based pagination | Missed rows — deletions shift offset backward | Use `chunkById()` for any mutation during iteration |
| Not ordering explicitly | Assuming default order is fine | Custom `orderBy` breaks chunk page calculation | Use `chunkById()` with explicit key column |
| Modifying the key column | Not realizing chunkById tracks last key | Next batch's `WHERE id > ?` skips or misses rows | Never update the key column inside a chunkById callback |
| Chunking on non-indexed columns | Assuming any column works | Full table scan per chunk | Ensure the key column is indexed |
| No transaction in callback | Simplifying the callback | Partial state on failure — some rows updated, some not | Wrap callback body in `DB::transaction()` |

## Anti-Patterns

- **chunk-where-chunkById-is-needed**: Using `chunk()` for batch updates or deletes. Offset drift causes incorrect processing. Default to `chunkById()`.
- **Unbounded chunking**: Running chunked processing without any progress tracking. If the job fails midway, the entire dataset must be reprocessed.
- **chunkById on non-unique columns**: Key-based pagination requires strictly increasing unique values. Non-unique keys cause infinite loops or missed rows.

## Examples

```php
// Safe bulk update — use chunkById for mutation safety
User::chunkById(100, function ($users) {
    foreach ($users as $user) {
        $user->update(['processed_at' => now()]);
    }
});

// Read-only export — chunk is acceptable
User::chunk(500, function ($users) {
    foreach ($users as $user) {
        Log::info("Exporting user {$user->id}");
    }
});

// Resumable batch processing
$lastId = Cache::get('user_processing_last_id', 0);
User::where('id', '>', $lastId)->chunkById(100, function ($users) {
    foreach ($users as $user) {
        $user->generateReport();
    }
    Cache::put('user_processing_last_id', $users->last()->id);
});
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Query Builder fundamentals (LIMIT, OFFSET, WHERE) |
| Prerequisite | Eloquent model querying basics |
| Closely Related | lazy-lazy-by-id |
| Closely Related | cursor |
| Closely Related | subquery-optimization |

## AI Agent Notes

- Prefer `chunkById()` over `chunk()` in any code generation involving mutations
- `chunk()` is only safe for read-only, static datasets
- Always wrap chunk callbacks in `DB::transaction()` when writing
- For UUID/ULID keys, pass the correct `$column` and `$alias` to `chunkById()`

## Verification

- [ ] `chunkById()` is used when the dataset may be mutated during iteration
- [ ] `chunk()` is only used for read-only exports on static datasets
- [ ] Callback body is wrapped in `DB::transaction()`
- [ ] Key column is indexed and monotonically increasing
- [ ] Checkpoint mechanism exists for resumable batch jobs
