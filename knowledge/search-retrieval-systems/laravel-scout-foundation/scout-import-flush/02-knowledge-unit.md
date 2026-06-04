# Knowledge Unit: scout:import / scout:flush

## Metadata

- **ID:** K009
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Batch operations

## Executive Summary

`scout:import` and `scout:flush` are Artisan commands for bulk synchronizing models with search indexes. `scout:import` iterates over all records of a model and pushes them to the search engine. `scout:flush` removes all records of a model from the index. They are the primary tools for initial index population, full re-indexes after schema changes, and index cleanup.

## Core Concepts

- **scout:import**: Streams model records, calls `makeAllSearchable()` on chunks. Supports `--chunk` size tuning.
- **scout:queue-import** (v10+): Dispatches parallel queued jobs per chunk using primary key range queries. Significantly faster for large datasets.
- **scout:flush**: Calls `engine->flush($model)` to clear the index. Irreversible — ensure backup or ability to re-import.
- **Model Class Argument**: Pass the fully qualified class name, e.g., `php artisan scout:import "App\Models\Product"`.

## Patterns

- **Initial setup**: Run `scout:import` after adding `Searchable` trait to existing models.
- **Schema change**: Update `toSearchableArray()`, then `scout:flush` + `scout:import`.
- **Deployment script**: Include `scout:queue-import` in deploy pipelines for auto-index rebuilds.

## Tradeoffs

| Approach | Speed | Resource Usage | Best For |
|---|---|---|---|
| scout:import | Slow (sequential) | Low memory per chunk | <10K records |
| scout:queue-import | Fast (parallel workers) | Higher queue throughput | >10K records |

## Performance Considerations

- Default chunk size is 500. Tune via `--chunk` parameter. Smaller for heavy relations, larger for simple models.
- `scout:queue-import` performance scales linearly with worker count. 20 workers can index 1M records in ~20 minutes.
- `scout:flush` is typically fast (engine-level bulk delete), but verify on your engine (Meilisearch has a dedicated clear-index endpoint).

## Production Considerations

- **Run during low-traffic windows**: Importing can load the search engine and database.
- **Monitor queue when using queue-import**: Ensure enough workers are available.
- **Test in staging first**: Verify `toSearchableArray()` output against the target engine schema.

## Common Mistakes

- Running `scout:import` without first running `scout:flush` — records accumulate as duplicates.
- Not tuning chunk size for model complexity — memory exhaustion with heavy relationships.
- Using `scout:import` on large datasets instead of `scout:queue-import`.

## Failure Modes

- **Timeouts**: `scout:import` on very large tables may hit PHP execution limits. Use `scout:queue-import` or increase `max_execution_time`.
- **Engine errors**: If the search engine rejects documents due to schema violations, the import silently skips or fails depending on configuration.
- **Memory**: Loading too many eager relations in `makeAllSearchableUsing()` can exhaust PHP memory.

## Ecosystem Usage

Standard deployment practice across all Scout-based Laravel applications.

## Related Knowledge Units

- K001 (Searchable trait)
- K010 (makeAllSearchableUsing)
- K008 (withoutSyncingToSearch)

## Research Notes

Sources: Laravel Scout docs, community production patterns. The queue-import feature was a significant improvement in Scout v10, solving the long-standing problem of import timeouts on large tables.


## Mental Models

- **Central Switchboard**: Laravel Scout is like a switchboard operator — you tell it which model to search and which engine to use, and it connects them without you handling the wiring.
- **Adapter Pattern**: Scout is the universal power outlet adapter. Your application speaks one language (Scout), and Scout translates to whatever search engine you plug in.

## Internal Mechanics

The implementation follows the provider/adapter pattern established by the framework. Configuration is resolved from the application config, and the engine adapter translates Scout's searchable trait method calls into engine-specific API operations. The serialization pipeline converts Eloquent models into search documents, applying attribute transformations and type casting before transmission to the search backend. Response parsing normalizes engine-specific result formats into a consistent collection structure with score/metadata annotations. The search lifecycle involves query construction, transmission, response parsing, and result hydration — each step is a potential optimization target.

## Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Primary search engine choice | Application scale and budget | Start with Meilisearch/Typesense for self-hosted; Algolia for managed |
| Single-engine vs hybrid | Comprehensive search quality | Hybrid (BM25 + vector) for production; single-engine for POC |
| Batch vs real-time indexing | Data freshness requirements | Batch for bulk loads; real-time queue for incremental updates |
| Embedding model selection | Quality vs latency budget | Larger models (text-embedding-3-large) for offline; distilled for real-time |
| Index schema design | Search relevance tuning | Index only searchable/filterable fields; avoid over-indexing |

