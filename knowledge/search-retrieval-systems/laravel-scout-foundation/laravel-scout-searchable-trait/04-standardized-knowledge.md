| Metadata | |
|---|---|
| KU ID | K001 |
| Subdomain | scout-foundation |
| Topic | Laravel Scout Searchable Trait |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

The `Searchable` trait is the foundational component of Laravel Scout. When added to an Eloquent model, it automatically synchronizes model events (create, update, delete) with the configured search engine index. It also provides the `search()` query builder and methods like `searchable()`/`unsearchable()` for manual index control.

## Core Concepts

- **Auto-Sync**: Model `saved`, `deleted`, `restored`, `forceDeleted` events trigger index updates.
- **Search Method**: `Model::search('query')` returns a `Builder` instance for fluent query construction.
- **searchable() / unsearchable()**: Manually add/remove records from the search index.
- **Index Mapping**: Each model maps to a search index named after the model's table by default.
- **Engine Abstraction**: The trait works identically across all Scout engines (database, Meilisearch, Algolia, Typesense).

## When To Use

- Every Eloquent model that needs to be searchable in a Laravel application
- Any Scout-based search implementation (required for Scout functionality)
- Models that need automatic synchronization with search indexes

## When NOT To Use

- A model that should never be searchable (meta-models, pivot tables, logs)
- When using a non-Eloquent data source (external API, CSV import)
- Read-model or CQRS patterns where the write model is separate

## Best Practices

1. **Add Searchable to models that need search**: Not every model needs to be searchable.
2. **Customize `toSearchableArray()`**: Limit indexed data to relevant fields only.
3. **Configure `searchableAs()`**: Customize index names for multi-index strategies.
4. **Use `shouldBeSearchable()`**: Gate which records appear in search results.
5. **Use `withoutSyncingToSearch()`**: Suppress indexing during bulk operations.

## Architecture Guidelines

- Add the `Searchable` trait to models, not to base `Model` classes (selective search).
- Configure engine-specific settings in `config/scout.php` per model.
- Use `makeAllSearchableUsing()` to eager-load relations during batch import.
- Combine with queue integration for production workloads.

## Performance Considerations

- Each model save triggers a search engine API call — use queues for production.
- `toSearchableArray()` runs on every index operation — keep it efficient.
- Batch operations via `searchable()` on a query builder reduce API calls.
- Indexed data size directly impacts search latency and storage costs.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Adding Searchable to all models | Convenience | Unnecessary API calls | Selective trait usage |
| Over-indexing fields | Default returns all attributes | Storage bloat, slower searches | Customize toSearchableArray |
| Not using withoutSyncingToSearch | Unaware of optimization | Multiple API calls per record | Wrap bulk operations |
| No queue in production | Default is sync | Slow HTTP responses | Enable SCOUT_QUEUE |

## Anti-Patterns

- **Base model Searchable trait**: If your base model has Searchable, every model gets indexed.
- **Indexing all columns by default**: Most columns don't need to be searchable.
- **Missing shouldBeSearchable**: Draft, archived, or soft-deleted records appearing in search.

## Examples

```php
class Post extends Model
{
    use Searchable;

    public function toSearchableArray(): array
    {
        return [
            'title' => $this->title,
            'body' => $this->body,
            'author' => $this->author->name,
        ];
    }

    public function shouldBeSearchable(): bool
    {
        return $this->isPublished();
    }
}
```

## Related Topics

- K005 (toSearchableArray customization)
- K006 (searchableAs / index naming)
- K007 (shouldBeSearchable conditional indexing)
- K008 (withoutSyncingToSearch)
- K017 (Soft delete handling in Scout)

## AI Agent Notes

- The Searchable trait is the entry point for all Scout functionality.
- Default behavior indexes all model attributes — always customize `toSearchableArray()`.
- For agents: always add queue for production, customize what gets indexed, and implement shouldBeSearchable for status-based filtering.

## Verification

- [ ] Searchable trait added to model
- [ ] `toSearchableArray()` customized to relevant fields only
- [ ] Index syncs on model create/update/delete
- [ ] Queue enabled for production
- [ ] `shouldBeSearchable()` implemented if gating needed
- [ ] Soft delete handling configured if applicable
