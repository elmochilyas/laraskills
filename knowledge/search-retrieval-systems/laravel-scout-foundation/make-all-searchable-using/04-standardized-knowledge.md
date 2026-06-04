| Metadata | |
|---|---|
| KU ID | K010 |
| Subdomain | search-indexing-and-synchronization |
| Topic | makeAllSearchableUsing / makeSearchableUsing |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

`makeAllSearchableUsing()` and `makeSearchableUsing()` allow developers to customize the Eloquent query used during Scout batch import operations. `makeAllSearchableUsing()` modifies the query for `scout:import` (all records), while `makeSearchableUsing()` modifies queries for `searchable()` calls on query builders. These methods enable eager loading of relationships, applying global scopes, and filtering which records are included in batch imports.

## Core Concepts

- **makeAllSearchableUsing**: Modifies the query for `scout:import` and `Artisan::call('scout:import')`.
- **makeSearchableUsing**: Modifies queries for model::query()->searchable().
- **Eager Loading**: Essential for indexed data that includes related model attributes.
- **Performance**: Prevents N+1 query problems during large imports.

## When To Use

- Indexed data includes related model attributes (author name, category, tags)
- Need to apply global scopes or filters during batch import
- Import performance is critical (large datasets with relationships)
- Default query performs N+1 queries on related data

## When NOT To Use

- `toSearchableArray()` only uses the model's own attributes (no relations)
- Dataset is small (<1000 records) and N+1 is negligible
- Default import performance is acceptable

## Best Practices

1. **Always eager-load relations** used in `toSearchableArray()` — prevents N+1 during import.
2. **Apply filters** if batch import should exclude certain records (e.g., soft-deleted).
3. **Test import performance** with realistic data volumes before production.
4. **Combine with chunking**: Scout imports in chunks by default (configurable size).

## Architecture Guidelines

- Override in the model class that uses `Searchable`.
- Return `$query->with('relations')` for eager loading.
- Can also add `->where()` conditions if batch import should differ from incremental sync.
- Works with all Scout engines — it optimizes the Eloquent query, not the search engine call.

## Performance Considerations

- Without eager loading, importing 10,000 models each with 3 relations generates 30,001 queries.
- With eager loading, the same import generates 4 queries (1 main + 3 relation queries).
- Chunk size (default 500) balances memory usage and import speed.
- Large imports benefit from running in a queue job with progress tracking.

## Examples

```php
class Post extends Model
{
    use Searchable;

    public function makeAllSearchableUsing($query)
    {
        return $query->with(['author', 'category', 'tags'])
            ->where('status', 'published');
    }

    public function toSearchableArray(): array
    {
        return [
            'title' => $this->title,
            'author_name' => $this->author->name,
            'category' => $this->category->name,
            'tags' => $this->tags->pluck('name'),
        ];
    }
}
```

## Related Topics

- K001 (Searchable trait)
- K005 (toSearchableArray customization)
- K009 (scout:import / scout:flush)

## AI Agent Notes

- Essential for any model that indexes related data in `toSearchableArray()`.
- The most common Scout performance optimization for batch imports.
- For agents: if `toSearchableArray()` accesses `$this->relation`, always add eager loading via this method.

## Verification

- [ ] Eager loading added for all relations used in toSearchableArray
- [ ] Import performance measured (queries per record)
- [ ] Chunk size configured appropriately
- [ ] Queue import working correctly with eager loading
