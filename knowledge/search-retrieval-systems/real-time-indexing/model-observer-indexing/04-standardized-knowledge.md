| Metadata | |
|---|---|
| KU ID | ku-05 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Model Observer Indexing |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

Scout's Searchable trait registers model observers that automatically sync Eloquent model events to the search index. On saved, the model is indexed. On deleted, the model is removed. This provides real-time index synchronization without manual intervention.

## Core Concepts

- **saved Observer**: Triggers index update/creation on model save
- **deleted Observer**: Triggers index removal on model delete
- **Force Deleted**: Soft-deleted models removed from index only on force delete
- **Restored Event**: Soft-deleted model restored → re-indexed
- **Bulk Operations**: Model::query()->searchable() for batch index

## When To Use

- Any model using Searchable trait
- Real-time index synchronization
- Automatic sync without manual calls

## When NOT To Use

- During bulk data migrations (use withoutSyncingToSearch)
- When manual control over indexing timing is needed
- For non-Eloquent data sources

## Best Practices

1. **Use queue with observers**: Prevent observer from blocking HTTP request.
2. **Use withoutSyncingToSearch() for bulk operations**: Avoid redundant index calls.
3. **Implement shouldBeSearchable()**: Gate indexing on model state (published, active).
4. **Test observer behavior**: Ensure deletes remove from index correctly.
5. **Handle soft deletes**: Only force-deleted models are removed from index.

## Related Topics

- K001 (Searchable trait)
- K007 (shouldBeSearchable)
- K008 (withoutSyncingToSearch)
- K017 (Soft delete handling)

## AI Agent Notes

- Observer-based indexing works automatically — just add the Searchable trait
- Queue integration is critical for not blocking HTTP requests
- For agents: Searchable trait + queue + shouldBeSearchable is the standard pattern

## Verification

- [ ] saved observer indexes model
- [ ] deleted observer removes from index
- [ ] Soft delete handling works
- [ ] shouldBeSearchable gates correctly
- [ ] Queue observers in production
- [ ] Bulk operations use withoutSyncingToSearch
