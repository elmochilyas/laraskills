| Metadata | |
|---|---|
| KU ID | ku-02 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Indexing Strategies |
| Source | Laravel Scout / Industry |
| Maturity | Stable |

## Overview

Indexing strategies define when and how data flows from the database to the search index. Three primary strategies: batch (full re-index), incremental (model event-driven), and conditional (selective indexing). The right strategy depends on data volume, update frequency, consistency requirements, and operational constraints.

## Core Concepts

- **Batch Indexing**: Full re-index of all records via scout:import. For initial population and periodic refreshes.
- **Incremental Indexing**: Model observers trigger index updates on save/delete. For ongoing sync.
- **Conditional Indexing**: shouldBeSearchable() gate. Index only when conditions are met.
- **Queued Indexing**: Async via Laravel queues. For performance and reliability.

## When To Use

- Batch: Initial indexing, schema changes, data recovery
- Incremental: Normal operation — keeps index in sync
- Conditional: Published/draft gating, soft-deleted records, role-based visibility

## When NOT To Use

- Batch-only for production updates (stale between re-indexes)
- Incremental-only for large migrations (too slow, use batch)
- No indexing strategy planned at all

## Best Practices

1. **Combine batch + incremental**: Batch for initial load, incremental for ongoing sync.
2. **Use queue for incremental**: Set 'queue' => true in Scout config.
3. **Use withoutSyncingToSearch() for bulk operations**: Avoid redundant index updates.
4. **Conditional indexing with shouldBeSearchable()** for visibility gating.
5. **Plan for index rebuilds**: Schema changes often require full re-index.

## Related Topics

- K001 (Searchable trait)
- K004 (Queue indexing)
- K007 (shouldBeSearchable)
- K008 (withoutSyncingToSearch)

## AI Agent Notes

- Most production apps use both batch and incremental strategies
- Queue-backed incremental indexing is the standard for production
- For agents: implement queue + incremental as default, batch for initial load

## Verification

- [ ] Batch import command configured
- [ ] Incremental sync via model observers
- [ ] Queue integration enabled for production
- [ ] Conditional indexing implemented (if needed)
- [ ] withoutSyncingToSearch used for bulk operations
- [ ] Index rebuild plan documented
