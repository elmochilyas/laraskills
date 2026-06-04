| Metadata | |
|---|---|
| KU ID | ku-08 |
| Subdomain | search-indexing-and-synchronization |
| Topic | Scout Import Commands |
| Source | Laravel Scout |
| Maturity | Stable |

## Overview

Scout provides artisan commands for batch index management: scout:import (index all records), scout:flush (remove all records from index), scout:sync-index-settings (sync engine-specific config), and scout:delete-all-indexes (remove all indexes).

## Core Concepts

- **scout:import**: Batch imports all models into search index
- **scout:flush**: Removes all models from search index
- **scout:sync-index-settings**: Syncs filterable/sortable/ranking settings per engine
- **scout:delete-all-indexes**: Destructive — removes all indexes
- **Chunk Configuration**: --chunk option for batch size

## When To Use

- Initial indexing after Scout setup
- After schema changes requiring re-index
- After data repair or backfill
- CI/CD deployment pipeline (index settings sync)

## When NOT To Use

- Importing single records (use model save observer)
- Production during peak traffic (schedule off-peak)

## Best Practices

1. **Run scout:sync-index-settings in deploy**: Ensures index config matches code.
2. **Use scout:import with queue**: scout:import --queue for large datasets.
3. **Chunk appropriately**: Default 500, adjust based on model complexity.
4. **Run scout:flush before import**: Clean rebuild.
5. **Automate in deployments**: Script index management.

## Related Topics

- K009 (scout:import / scout:flush)
- K010 (makeAllSearchableUsing)

## AI Agent Notes

- scout:sync-index-settings is often forgotten — critical for engine config
- scout:import is the primary command for initial index population
- For agents: include scout:sync-index-settings and scout:import in deployment scripts

## Verification

- [ ] scout:import works for all models
- [ ] scout:flush removes from index
- [ ] scout:sync-index-settings configured in deploy
- [ ] Chunk size optimized
- [ ] Queue import working
- [ ] Import commands automated in CI/CD
