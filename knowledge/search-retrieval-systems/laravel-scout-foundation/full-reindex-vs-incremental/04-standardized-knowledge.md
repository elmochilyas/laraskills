| Metadata | |
|---|---|
| KU ID | ku-03 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Full Re-index vs Incremental |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

Full re-index (scout:import) rebuilds the entire search index from the database. Incremental indexing syncs individual model changes as they happen. Each serves different purposes: full re-index for initialization and recovery, incremental for day-to-day operation.

## Core Concepts

- **Full Re-index**: Truncates index, re-imports all records. Use for schema changes, data repair, initial population.
- **Incremental Sync**: Auto-syncs on model save/delete via Searchable trait observers.
- **Queue Import**: scout:import with queue processes models in chunks.
- **Chunk Size**: Configurable batch size for import (default 500).

## When To Use

- Full re-index: Initial setup, schema change, corruption recovery, bulk data fix
- Incremental: Normal production operation
- Both: Full re-index periodically (e.g., weekly) + incremental always on

## When NOT To Use

- Full re-index on every deploy (use incremental unless schema changed)
- Incremental-only after major data migration (use batch import)

## Best Practices

1. **Run full re-index after schema changes** (new fields, changed mapping).
2. **Use incremental for day-to-day**: Efficient, low-latency sync.
3. **Schedule periodic full re-index**: Catch drift from any missed updates.
4. **Use makeAllSearchableUsing()**: Eager load relations during import.
5. **Monitor import progress**: Large imports may take hours.

## Related Topics

- K009 (scout:import / scout:flush)
- K010 (makeAllSearchableUsing)
- K004 (Queue indexing)

## AI Agent Notes

- Full re-index is expensive — only run when needed
- Combined strategy (incremental + periodic full re-index) is most reliable
- For agents: incremental for daily, full re-index on schema change or monthly

## Verification

- [ ] scout:import works correctly
- [ ] Incremental sync from model saves
- [ ] Queue configured for import
- [ ] makeAllSearchableUsing configured for relations
- [ ] Periodic full re-index scheduled
- [ ] Schema change → re-index process documented
