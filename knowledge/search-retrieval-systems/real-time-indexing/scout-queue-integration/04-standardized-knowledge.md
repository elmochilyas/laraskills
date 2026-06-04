| Metadata | |
|---|---|
| KU ID | K004 |
| Subdomain | real-time-indexing |
| Topic | Scout Queue Integration |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

Scout's queue integration moves search index synchronization from the HTTP request cycle to background queue workers. Setting `SCOUT_QUEUE=true` delegates every `save()`-triggered index update to a queued job. For bulk imports, `scout:queue-import` dispatches parallel chunked jobs.

## Core Concepts

- **Queue Config**: `'queue' => true` in `config/scout.php`; specify connection and queue name
- **Job Types**: `MakeSearchable` (add/update) and `DeleteFromSearch` (remove)
- **Dedicated Queue**: Separate queue (e.g., `scout`) prevents blocking by other jobs
- **scout:queue-import**: Chunked parallel import using primary key ranges
- **Batch System**: Scout v10+ uses Laravel batch for progress tracking

## When To Use

- Production applications (always recommended)
- High-traffic apps where sync latency affects UX
- Apps using remote search engines (network latency)
- Bulk import operations with large datasets

## When NOT To Use

- Development/CI environments — adds unnecessary complexity
- Testing — use `Queue::fake()` or `Scout::fake()`
- Real-time search requiring immediate index consistency

## Best Practices

1. **Always async in production** — synchronous indexing ties response time to search engine latency
2. **Use dedicated queue** — `'queue' => 'scout'` prevents interference
3. **Set `tries` to 3** — retry with monitoring on failed jobs
4. **Monitor with Horizon** — track throughput, failure rate, and backlog
5. **Warm queue after deployment** — `scout:queue-import` catches up
6. **Test async behavior** — use `Queue::fake()` to assert dispatch

## Architecture Guidelines

- Configure per-environment: async in production, sync in dev
- Use a dedicated queue worker: `php artisan queue:work redis --queue=scout,default`
- Set `--max-time=3600` on workers to recycle memory
- Implement failed-job monitoring with alerts

## Performance Considerations

- Redis handles hundreds of operations/sec per worker
- MySQL/PostgreSQL queue backends are slower but fine for low-volume apps
- `scout:queue-import` with 20 workers can backfill 1M records in ~20 minutes
- Tune `--chunk=1000` based on record size

## Security Considerations

- Queue jobs serialize model data at dispatch time — ensure sensitive data is excluded
- Failed job monitoring prevents data leaking from unprocessed deletes

## Common Mistakes

- Enabling queue without running a worker — index never updates silently
- Using default queue — long-running jobs block scout operations
- Not handling failed jobs — silent indexing failures leave data out of sync
- Not testing async behavior — missing dispatch assertions in tests

## Anti-Patterns

- **Workerless queue**: Setting queue=true without running a queue worker
- **Shared queue**: Mixing scout jobs with long-running email/report jobs on the same queue
- **No failure handling**: Ignoring the `failed_jobs` table for scout operations

## Examples

```php
// config/scout.php
'queue' => [
    'connection' => 'redis',
    'queue' => 'scout',
],

// Run dedicated worker
// php artisan queue:work redis --queue=scout,default --tries=3 --max-time=3600

// Bulk import with queue
// php artisan scout:queue-import App\\Models\\Post --chunk=1000
```

## Related Topics

- K001 (Searchable trait)
- K009 (scout:import / scout:flush)
- K064 (Real-time indexing)
- K063 (Search query caching)

## AI Agent Notes

- Queue integration is the standard for production Laravel search
- Prevents search latency from affecting HTTP response times
- For agents: always enable queue in production, use dedicated queue, monitor failed jobs
