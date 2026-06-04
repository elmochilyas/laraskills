| Metadata | |
|---|---|
| KU ID | K009 |
| Subdomain | search-indexing-and-synchronization |
| Topic | scout:import / scout:flush |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

`scout:import` and `scout:flush` are Artisan commands that perform batch operations on search indexes. `scout:import` reads all records from the database and sends them to the search engine, replacing the entire index. `scout:flush` clears all records from a model's search index. These commands are used for initial index population, schema changes, data recovery, and index reset.

## Core Concepts

- **scout:import**: `php artisan scout:import App\Models\Post` — imports all searchable records.
- **scout:flush**: `php artisan scout:flush App\Models\Post` — deletes all records from the index.
- **Chunked Processing**: Import processes records in chunks (default 500) to manage memory.
- **Queue Integration**: When queue is enabled, import jobs are dispatched as queued jobs.
- **Progress Display**: Shows progress bar for import tracking.

## When To Use

- Initial population of a search index after Scout setup
- Rebuilding index after schema or configuration changes
- Data recovery after index corruption
- Periodic full re-index (e.g., weekly cron job)
- Clearing an index before repopulation

## When NOT To Use

- Day-to-day record updates (use incremental real-time sync)
- Selective re-indexing of specific records
- Development/testing with small datasets (import still works but may be overkill)
- When import would exceed available memory (increase chunk size or use queue)

## Best Practices

1. **Always use queue** for production imports: Set `SCOUT_QUEUE=true` or configure per-model queue.
2. **Run flush before import**: Clear old data before importing fresh records.
3. **Schedule periodic full imports**: `php artisan scout:import ... --schedule` or cron.
4. **Test import on staging**: Validate data mapping before production import.
5. **Monitor import duration**: Large imports (>1M records) may take hours.

## Architecture Guidelines

- Run imports as queue jobs for production to avoid HTTP timeout.
- Use `makeAllSearchableUsing()` to eager-load relations during import.
- Import can be called programmatically: `Artisan::call('scout:import', ['model' => Post::class])`.
- Chain flush + import: `scout:flush` then `scout:import` for complete rebuild.

## Performance Considerations

- Chunk size affects memory: smaller = safer, larger = faster.
- Without queue, scout:import blocks the CLI until complete (may time out on large datasets).
- Each chunk sends a batch API call to the search engine.
- Eager loading relations via `makeAllSearchableUsing()` prevents N+1 queries.

## Security Considerations

- scout:import sends all searchable records to the search engine — ensure sensitive fields are excluded in `toSearchableArray()`.
- Production imports should run in maintenance mode or during low-traffic periods.
- Verify that soft-deleted records are properly excluded if needed.

## Related Topics

- K001 (Searchable trait)
- K010 (makeAllSearchableUsing)
- K008 (withoutSyncingToSearch)
- K004 (Queue integration)

## AI Agent Notes

- scout:import replaces the entire index — use with care in production.
- Always pair with `makeAllSearchableUsing()` for relation eager loading.
- For agents: production imports should be queued and scheduled during low-traffic windows.

## Verification

- [ ] scout:import works for each searchable model
- [ ] scout:flush clears index correctly
- [ ] Queue import functional and monitored
- [ ] makeAllSearchableUsing configured for eager loading
- [ ] Import duration acceptable for dataset size
- [ ] Periodic import scheduled if needed
