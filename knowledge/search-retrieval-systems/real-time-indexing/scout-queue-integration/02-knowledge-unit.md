# Knowledge Unit: Scout Queue Integration

## Metadata

- **ID:** K004
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Core — async indexing via Laravel queues

## Executive Summary

Scout's queue integration moves search index synchronization from the HTTP request cycle to background queue workers. Setting `SCOUT_QUEUE=true` delegates every `save()`-triggered index update to a queued job, decoupling application response time from search engine latency. For bulk imports, `scout:queue-import` (Scout v10+) dispatches parallel chunked jobs that scale linearly with worker count.

## Core Concepts

- **Queue Config**: `'queue' => true` in `config/scout.php` enables async indexing. Specify connection and queue name: `['connection' => 'redis', 'queue' => 'scout']`.
- **Job Type**: Scout dispatches `MakeSearchable` (add/update) and `DeleteFromSearch` (remove) jobs. These implement `ShouldQueue` and use the configured queue.
- **Dedicated Queue**: Using a separate queue (e.g., `scout`) prevents search indexing from being blocked by long-running email or notification jobs.
- **scout:queue-import**: Dispatches one job per chunk using primary key range queries (`MIN(id)` to `MAX(id)`). Multiple workers process chunks in parallel.

## Internal Mechanics

When `'queue' => true`, Scout wraps the engine's `update()` or `delete()` call in a queued job. The job serializes the model's `toSearchableArray()` output (not the full model) at dispatch time. The `MakeSearchable` job is unique — it checks `shouldBeSearchable()` again on execution, so if a model becomes unsearchable between dispatch and execution, it skips indexing. Scout v10+ uses Laravel's batch system for `scout:queue-import`, enabling progress tracking via `Bus::batch()`.

## Patterns

- **Always async in production**: Synchronous indexing ties HTTP response time to search engine network latency (20-200ms per save). For endpoints saving multiple related models, this compounds.
- **Dedicated worker**: `php artisan queue:work redis --queue=scout,default --tries=3 --max-time=3600`.
- **Monitor with Horizon**: Track scout queue throughput, failed jobs, and backlog.

## Architectural Decisions

Queue integration was added early in Scout's life (v3) when teams reported production incidents from indexing latency spikes. The default remains synchronous for simplicity in development, but the config system allows per-environment control.

## Tradeoffs

- **Consistency gap**: With queued indexing, search results lag behind database state by queue processing time (typically <1s with Redis). For write-then-read-search patterns, this creates a "missing results" window.
- **Job failure handling**: Failed index jobs can lead to inconsistent state. A retry-then-fail strategy means stale data persists until manually re-indexed.
- **Serialization cost**: Model data is serialized at dispatch time. If the model changes between dispatch and execution, the index reflects the older state.

## Performance Considerations

- Queue throughput on Redis handles hundreds of index operations per second per worker.
- MySQL/PostgreSQL queue backends are slower but acceptable for low-volume applications.
- `scout:queue-import` with 20 workers can backfill 1M records in under 20 minutes against a single search node.
- Pass `--chunk=1000` to tune batch size against record size.

## Production Considerations

- **Set `tries` to 3** — retry twice before failing. Add a monitoring alert on `scout` queue failed jobs.
- **Use `--max-time=3600`** on workers to recycle memory from long-lived PHP processes.
- **Warm the queue after deployment** — `scout:queue-import` ensures the index catches up.
- **Test async behavior** — use `Queue::fake()` to assert jobs were dispatched without processing them.

## Common Mistakes

- Enabling queue without running a worker — index never updates silently.
- Using the default queue — long-running jobs block scout index operations.
- Not handling failed jobs — a silent indexing failure means data is in the database but not the index.

## Failure Modes

- **Worker death without monitoring**: Scout stops indexing silently. Horizon or similar monitoring is essential.
- **Queue backlog**: A massive `scout:queue-import` competing with real-time save events can cause minutes of lag.
- **Database connection pool exhaustion**: Workers may hold connections during index operations in tight loops.

## Ecosystem Usage

Standard practice for production Laravel applications using Scout with third-party engines. Used in conjunction with Laravel Horizon for queue monitoring.

## Related Knowledge Units

- K001 (Searchable trait)
- K009 (scout:import / flush)
- K064 (Real-time indexing)

## Research Notes

Sources: Laravel 13.x Scout docs, community production patterns. The `scout:queue-import` feature (Scout v10) significantly improved bulk import performance by using parallel chunked jobs instead of sequential streaming. The old `scout:import` is still available but deprecated for large datasets.


## Mental Models

- **Central Switchboard**: Laravel Scout is like a switchboard operator — you tell it which model to search and which engine to use, and it connects them without you handling the wiring.
- **Adapter Pattern**: Scout is the universal power outlet adapter. Your application speaks one language (Scout), and Scout translates to whatever search engine you plug in.

