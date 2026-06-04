# Knowledge Unit: Real-Time Indexing (Observer-Based)

## Metadata

- **ID:** K064
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Scout
- **Maturity:** Stable
- **Laravel Relevance:** Model events to index sync

## Executive Summary

Real-time indexing is Scout's default behavior: every Eloquent model save, update, or delete automatically triggers a search index sync via model observers. This provides near-instant consistency between the database and search index, eliminating the need for scheduled batch syncs for active records.

## Core Concepts

- **Observer-Driven**: Scout registers observers on the `saved`, `deleted`, `restored`, and `forceDeleted` Eloquent events.
- **Sync vs Async**: Real-time sync can be synchronous (default) or queued (with `SCOUT_QUEUE=true`).
- **Scope**: Applies to all models with the `Searchable` trait. Individual operations can opt out via `withoutSyncingToSearch()`.
- **Incremental Updates**: Only changed records are re-indexed, not entire tables.

## Patterns

- **Default for active records**: Blog posts, products, users — any actively changing model.
- **Supplement with batch**: Use `scout:import` for initial population, real-time sync for ongoing changes.
- **Attribute-gated updates**: Scout 10+ `searchIndexShouldBeUpdated()` lets you skip indexing when only non-searchable attributes change.

## Architectural Decisions

Scout chose observer-based sync over polling or scheduled tasks because it provides the strongest consistency guarantee with minimal latency. The tradeoff is that every model save incurs indexing overhead.

## Tradeoffs

- Real-time sync provides immediate consistency but adds latency to every save operation.
- Queue-based real-time sync reduces response time but introduces a consistency window.
- Bypassed by direct database modifications (not using Eloquent).

## Performance Considerations

- Synchronous real-time indexing adds search engine network latency to HTTP response time (typically 20-200ms extra).
- Queued real-time indexing adds ~1-5ms for job dispatch but defers the actual index operation.
- Real-time indexing of frequently updated models (e.g., view counters) wastes resources.

## Production Considerations

- **Queue real-time sync** for production to maintain response time SLAs.
- **Use `searchIndexShouldBeUpdated()`** to avoid re-indexing when only non-searchable fields change (e.g., `updated_at` timestamps, view counts).
- **Monitor queue backlog** — a growing scout queue indicates the index is falling behind.
- **Consider `saveQuietly()`** for internal model updates that shouldn't trigger indexing (e.g., setting `last_indexed_at`).

## Common Mistakes

- Using synchronous indexing in production — every save blocks on search engine response.
- Not using `searchIndexShouldBeUpdated()` — wasteful re-indexing of unchanged fields.
- Forgetting that real-time sync only works for Eloquent operations — raw SQL inserts bypass it.

## Failure Modes

- Queue worker dies — index stops updating silently until the worker is restarted.
- Observer fires infinite loop — `toSearchableArray()` triggers a save that triggers the observer.
- Network partition — synchronous indexing causes failed saves if the search engine is unreachable.

## Ecosystem Usage

The default indexing strategy for all Scout-based search implementations. Most production systems pair it with queue-based async processing.

## Related Knowledge Units

- K001 (Searchable trait)
- K004 (Scout queue integration)
- K007 (shouldBeSearchable)
- K008 (withoutSyncingToSearch)

## Research Notes

Source: Laravel Scout docs, production patterns. Real-time observer-based indexing is the default because it provides the best balance of consistency and automation for most applications.


## Mental Models

- **Mirror Reflection**: Index synchronization is like keeping a mirror reflection of your database in the search engine. Every change to the original must be reflected in the mirror.
- **Conveyor Belt**: Batch indexing is a conveyor belt — documents enter on one end (import), travel through processing, and emerge searchable on the other end.

## Internal Mechanics

The implementation follows the provider/adapter pattern established by the framework. Configuration is resolved from the application config, and the engine adapter translates Scout's searchable trait method calls into engine-specific API operations. The serialization pipeline converts Eloquent models into search documents, applying attribute transformations and type casting before transmission to the search backend. Response parsing normalizes engine-specific result formats into a consistent collection structure with score/metadata annotations. The search lifecycle involves query construction, transmission, response parsing, and result hydration — each step is a potential optimization target.

