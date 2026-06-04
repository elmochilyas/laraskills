| Metadata | |
|---|---|
| KU ID | K007 |
| Subdomain | search-indexing-and-synchronization |
| Topic | shouldBeSearchable |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

The `shouldBeSearchable()` method controls whether an individual model record appears in the search index. It acts as a gate — returning `false` prevents the record from being indexed or included in search results. This is essential for publishing workflows, soft-deleted records, access control, and any scenario where only a subset of records should be searchable.

## Core Concepts

- **Gate Method**: Returning `false` from `shouldBeSearchable()` excludes the record from the index.
- **On Save Check**: Called during model save — if the record becomes non-searchable, it's removed.
- **On Import Check**: Also respected during `scout:import` — excluded records are not imported.
- **Dynamic Gating**: Can check any model state — status, visibility flag, tenant assignment, etc.

## When To Use

- Draft/published workflows — only published content should be searchable
- Soft-delete handling — deleted records excluded from search
- Visibility gating — records visible only to specific roles or tenants
- Time-based availability — scheduled publishing/expiration
- Archival status — archived records excluded from default search

## When NOT To Use

- When the condition is based on user permissions (filter at query time, not index time)
- For temporary exclusion (use `unssearchable()` or `withoutSyncingToSearch()` instead)
- When the condition changes frequently (each change triggers re-index)
- When the model should always be searchable (omit the method entirely)

## Best Practices

1. **Combine with `searchIndexShouldBeUpdated()`**: Avoid re-indexing when only non-searchable attributes change.
2. **Keep logic simple**: Complex logic in `shouldBeSearchable()` runs on every save.
3. **Test both transitions**: Test that records are added to and removed from the index when gating conditions change.
4. **Document the gating logic**: Team members need to understand which records are (and aren't) searchable.

## Architecture Guidelines

- Override in the Searchable model class: `public function shouldBeSearchable(): bool { return $this->isPublished(); }`.
- Scout automatically removes records from the index when the method returns false during save.
- Works for both sync and queue-based indexing.
- For multi-condition gating, keep logic in a dedicated method and call it from `shouldBeSearchable()`.

## Performance Considerations

- `shouldBeSearchable()` runs on every model save — keep it fast (no database queries).
- Changing from `true` to `false` triggers a delete API call to the search engine.
- Frequent gating condition changes cause excessive index churn.
- The method is not called during `toSearchableArray()` — if the record is excluded, `toSearchableArray()` is never called.

## Examples

```php
class Post extends Model
{
    use Searchable;

    public function shouldBeSearchable(): bool
    {
        return $this->isPublished() && !$this->archived;
    }

    // Publish/unpublish triggers correct index behavior
    public function publish(): void
    {
        $this->update(['status' => 'published']);
        // Scout automatically adds to index
    }

    public function unpublish(): void
    {
        $this->update(['status' => 'draft']);
        // Scout automatically removes from index
    }
}
```

## Related Topics

- K001 (Searchable trait)
- K017 (Soft delete handling)
- K008 (withoutSyncingToSearch)

## AI Agent Notes

- `shouldBeSearchable()` prevents unwanted records from entering the index entirely.
- Scout automatically removes records when transitioning from searchable to non-searchable.
- For agents: always implement for any model with status-based visibility (draft/published, active/inactive).

## Verification

- [ ] shouldBeSearchable returns correct value for all record states
- [ ] Records added/removed when gating condition changes
- [ ] scout:import respects shouldBeSearchable
- [ ] Performance impact measured (runs on every save)
