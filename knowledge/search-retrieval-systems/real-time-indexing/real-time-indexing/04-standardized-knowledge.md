| Metadata | |
|---|---|
| KU ID | K064 |
| Subdomain | real-time-indexing |
| Topic | Real-Time Indexing (Observer-Based) |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

Real-time indexing is Scout's default behavior: every Eloquent model save, update, or delete automatically triggers a search index sync via model observers. This provides near-instant consistency between the database and search index, eliminating the need for scheduled batch syncs for active records.

## Core Concepts

- **Observer-Driven**: Scout registers observers on `saved`, `deleted`, `restored`, `forceDeleted` Eloquent events
- **Sync vs Async**: Synchronous (default) or queued (`SCOUT_QUEUE=true`)
- **Scope**: All models with `Searchable` trait; opt out via `withoutSyncingToSearch()`
- **Incremental Updates**: Only changed records are re-indexed, not entire tables
- **Attribute Gating**: `searchIndexShouldBeUpdated()` (Scout 10+) skips indexing for non-searchable changes

## When To Use

- Active records that change frequently (blog posts, products, users)
- Applications needing near-instant DB-to-index consistency
- Default strategy for all Scout-based search implementations

## When NOT To Use

- During bulk data migrations or imports — use `withoutSyncingToSearch()`
- For non-Eloquent data sources (raw SQL, external APIs)
- When manual control over indexing timing is explicitly needed

## Best Practices

1. **Queue real-time sync** in production to maintain response time SLAs
2. **Use `searchIndexShouldBeUpdated()`** to skip indexing when only non-searchable fields change
3. **Monitor queue backlog** — growing queue indicates index falling behind
4. **Use `saveQuietly()`** for internal updates (e.g., `last_indexed_at` timestamps)
5. **Supplement with batch imports** for initial population

## Architecture Guidelines

- Pair observer-based sync with queue-based async processing in production
- Gate expensive model relationships with `searchIndexShouldBeUpdated()`
- Use `withoutSyncingToSearch()` for bulk Eloquent operations
- Avoid bypassing observers with direct database modifications

## Performance Considerations

- Synchronous indexing adds search engine latency (20-200ms) to HTTP response time
- Queued indexing adds ~1-5ms for job dispatch but defers actual index operation
- Frequently updated models (view counters) waste resources if indexed on every change

## Security Considerations

- Observer sync respects model authorization boundaries
- Soft-deleted models remain in index until force-deleted
- Ensure observer logic doesn't expose data that should be excluded from search

## Common Mistakes

- Using synchronous indexing in production — every save blocks on search engine response
- Not implementing `searchIndexShouldBeUpdated()` — wasteful re-indexing
- Forgetting real-time sync only works for Eloquent operations
- Observer-created infinite loops when `toSearchableArray()` triggers saves

## Anti-Patterns

- **Sync in production**: Never use synchronous indexing with remote search engines
- **Blind indexing**: Indexing every attribute without gating — view counters, timestamps
- **No observer-awareness**: Using model observers without understanding their indexing impact

## Examples

```php
// Enable queued indexing in config/scout.php
'queue' => true,

// Gate indexing to only when searchable fields change
public function searchIndexShouldBeUpdated(array $changes): bool
{
    return !empty(array_intersect(
        array_keys($changes),
        ['title', 'body', 'tags']
    ));
}

// Skip indexing for bulk operations
Post::query()->withoutSyncingToSearch()->update(['views' => 0]);
```

## Related Topics

- K001 (Searchable trait)
- K004 (Scout queue integration)
- K007 (shouldBeSearchable)
- K008 (withoutSyncingToSearch)
- K009 (scout:import / scout:flush)

## AI Agent Notes

- Real-time indexing is Scout's default behavior — no explicit configuration needed
- Always enable queue in production; disable in dev/test
- For agents: Searchable trait + queue + searchIndexShouldBeUpdated is the standard pattern
