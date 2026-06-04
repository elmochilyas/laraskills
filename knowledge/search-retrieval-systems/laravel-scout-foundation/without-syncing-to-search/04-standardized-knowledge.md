| Metadata | |
|---|---|
| KU ID | K008 |
| Subdomain | search-indexing-and-synchronization |
| Topic | withoutSyncingToSearch |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

`withoutSyncingToSearch()` temporarily suspends Scout's automatic index synchronization for a block of code. This is essential for bulk operations (batch updates, imports, data migrations) where individual record indexing would be wasteful. Instead of sending N separate API calls for N records, you perform the operation silently and then re-index the affected records in bulk.

## Core Concepts

- **Suspend Sync**: Wrapping code in `withoutSyncingToSearch()` prevents model events from triggering index updates.
- **Scope**: Only affects the wrapped code block — sync resumes automatically afterward.
- **Bulk Operations**: Essential when updating many records at once.
- **Manual Sync**: After the bulk operation, call `$model->searchable()` to re-index.

## When To Use

- Bulk imports or data migrations affecting many records
- Batch updates that shouldn't trigger per-record indexing
- Seeding large datasets in development/testing
- Programmatic updates where only the final state should be indexed
- Avoiding duplicate indexing during `scout:import` (import already handles batch)

## When NOT To Use

- Individual record saves (the overhead is negligible)
- When you forget to re-index afterward (records become stale or missing from index)
- Real-time applications requiring immediate index consistency
- Debugging/tracking indexing behavior (use sync mode for logging)

## Best Practices

1. **Always re-index after bulk operations**: Call `$model->searchable()` on affected records.
2. **Use for batch updates**: When updating 1000+ records, disable sync, update, then batch re-index.
3. **Combine with chunked re-indexing**: Re-index in chunks to manage memory.
4. **Test both with and without sync**: Verify that skipped indexing events are properly re-indexed.

## Architecture Guidelines

- Accepts a closure: `Model::withoutSyncingToSearch(fn() => ...)`.
- Also available as a static method on any Searchable model.
- Scout's `scout:import` command already manages batch indexing — you don't need this during imports.
- For jobs, wrap the entire job body in `withoutSyncingToSearch()` if processing many records.

## Performance Considerations

- Without this method, updating 10,000 records triggers 10,000 search engine API calls (each 20-200ms).
- With this method + batch re-index, the same operation might use 20 API calls (chunked).
- Network round trips to the search engine are the primary cost saved.
- Memory usage during re-index depends on chunk size.

## Examples

```php
// Before: N API calls
foreach ($posts as $post) {
    $post->update(['status' => 'published']);
    // Each save triggers index update
}

// After: 1 batch API call
Post::withoutSyncingToSearch(function () use ($posts) {
    foreach ($posts as $post) {
        $post->update(['status' => 'published']);
    }
});

// Re-index the affected records
Post::whereIn('id', $posts->pluck('id'))->searchable();
```

## Related Topics

- K001 (Searchable trait)
- K009 (scout:import / scout:flush)
- K010 (makeAllSearchableUsing)
- K004 (Queue integration)

## AI Agent Notes

- Essential performance optimization for any bulk operation on Searchable models.
- Forgetting to re-index after skipping sync is the most common mistake.
- For agents: always use for batch updates, and always remember to re-index afterward.

## Verification

- [ ] withoutSyncingToSearch used for bulk operations
- [ ] Re-index performed after bulk ops
- [ ] Performance improvement measured (API calls reduced)
- [ ] No stale/missing records in index after bulk operations
