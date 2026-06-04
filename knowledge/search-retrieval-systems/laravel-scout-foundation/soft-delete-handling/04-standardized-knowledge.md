| Metadata | |
|---|---|
| KU ID | K017 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Soft Delete Handling in Scout |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

Scout automatically handles soft-deleted models through the `__soft_deleted` attribute. When a soft-deletable model is deleted, Scout sets `__soft_deleted = true` in the search index entry and removes it from search results. Restoring a soft-deleted model sets `__soft_deleted = false` and returns it to search results. Force-deleting a model removes it from the index entirely.

## Core Concepts

- **__soft_deleted**: Scout adds this boolean attribute to the search index for soft-deletable models.
- **Automatic Handling**: No additional configuration needed — Scout detects `SoftDeletes` trait.
- **Restore Handling**: Restoring a model automatically sets `__soft_deleted = false` in the index.
- **Force Delete**: `forceDelete()` removes the record from both database and search index.
- **Search Exclusion**: Records with `__soft_deleted = true` are excluded from search results by default.

## When To Use

- Any Eloquent model using Laravel's `SoftDeletes` trait that also uses Scout's `Searchable` trait
- Applications needing soft delete functionality with search integration
- Auditing/history requirements where deleted records must be retained in the database

## When NOT To Use

- Models using hard deletes (records are physically removed) — no soft delete handling needed
- When deleted records should remain searchable (override default behavior)
- When using custom soft delete implementations not based on Laravel's `SoftDeletes` trait

## Best Practices

1. **Ensure SoftDeletes trait is on the model**: Scout detects it automatically.
2. **Use `forceDelete()` for permanent removal from both DB and index**.
3. **Test restored records**: Verify that restored records reappear in search results.
4. **Combine with `shouldBeSearchable()`**: Add additional gating for soft-deleted + draft records.
5. **Consider queue integration**: Soft delete operations trigger index sync — queue in production.

## Architecture Guidelines

- Add `SoftDeletes` trait to model: Scout handles the rest automatically.
- The `__soft_deleted` attribute is automatically included in `toSearchableArray()`.
- For custom soft delete implementations, manually manage the `__soft_deleted` attribute.
- Filter by `__soft_deleted` in search queries if you need to include soft-deleted records.

## Performance Considerations

- Soft delete operations trigger a search engine update API call (same as any model save).
- Batch soft deleting many records at once should use `withoutSyncingToSearch()` + batch re-index.
- Each soft delete/restore results in one index update operation.

## Related Topics

- K001 (Searchable trait)
- K007 (shouldBeSearchable)
- K008 (withoutSyncingToSearch)
- K009 (scout:import / scout:flush)

## AI Agent Notes

- Scout handles soft deletes automatically — no extra configuration needed.
- `__soft_deleted` prevents deleted records from appearing in search results.
- For agents: just add `SoftDeletes` to the model; Scout does the rest.

## Verification

- [ ] SoftDeletes trait on model with Searchable
- [ ] Soft-deleted records excluded from search results
- [ ] Restored records reappear in search
- [ ] forceDelete removes from index
- [ ] __soft_deleted attribute present in index
