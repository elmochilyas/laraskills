# Knowledge Unit: Laravel Scout Searchable Trait

## Metadata

- **ID:** K001
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Core — every Laravel search starts here

## Executive Summary

The `Searchable` trait is the foundational building block of Laravel Scout. It uses Eloquent model observers to automatically synchronize model lifecycle events (create, update, delete, restore, forceDelete) with a configured search engine. Adding the trait to a model immediately enables search indexing and the `search()` query DSL without any further configuration. The trait's observer hooks into Eloquent's `saved`, `deleted`, `restored`, and `forceDeleted` events, making indexing transparent to application code.

## Core Concepts

- **Model Observer Pattern**: Scout registers observers on the `saved` and `deleted` Eloquent events. When a model is saved, Scout pushes the model's searchable array to the engine. When deleted, it removes the record from the index.
- **Searchable Data Shape**: By default, Scout uses the model's `toArray()` output. Override `toSearchableArray()` to control exactly which fields (including related data) are sent to the search index.
- **Key Management**: The model's primary key is used as the document ID in the search index. Override `getScoutKey()` and `getScoutKeyName()` for custom key strategies (UUIDs, composite keys).
- **Search DSL**: The trait adds a `search()` static method: `Model::search('query')->where('status', 'active')->paginate(20)`.

## Mental Models

- **Database Mirror**: Think of the search index as a denormalized view of your database optimized for text retrieval. The `Searchable` trait maintains eventual consistency between the two.
- **Event-Driven Sync**: The trait treats every Eloquent `save()` as a potential index update. This is analogous to database triggers — automatic, transparent, and requiring awareness for bulk operations.

## Internal Mechanics

Scout's observer listens on `Illuminate\Database\Eloquent\Model::saved` and `deleted`. When `saved` fires, Scout checks `shouldBeSearchable()` (if defined) to decide whether to index. It then serializes the model via `toSearchableArray()` and dispatches an indexing job (if queues are enabled) or calls the engine's `update()` method synchronously. The `deleted` handler calls the engine's `delete()` method. Soft-deleted models emit the standard deleted event; Scout checks for the `SoftDeletes` trait and sets `__soft_deleted` on the searchable array when a model is trashed.

## Patterns

- **Always queue indexing** in production via `'queue' => true`.
- **Denormalize into `toSearchableArray()`** — include related model data (category names, author names) to avoid join queries during search.
- **Use `shouldBeSearchable()`** for publish/draft gating to keep unpublished content out of results.
- **Customize index names** with `searchableAs()` to support multi-tenancy or environment separation.

## Architectural Decisions

- **Trait vs Interface**: Scout chose a trait (with default method implementations) over an interface to minimize boilerplate. Models just `use Searchable;` and get full functionality with no required methods.
- **Observer Registration**: Scout registers observers in its service provider via `Model::observe()`. This is eager — every Searchable model gets observers on every request. The tradeoff is performance overhead from observer checks even when models aren't changing.
- **Synchronous Default**: Scout defaults to synchronous indexing for simplicity. The `queue` config option moves this to async, but the default choice favors correctness and simplicity over performance.

## Tradeoffs

| Decision | Tradeoff |
|---|---|
| Observer-based automatic sync | Zero configuration, but bulk operations trigger N index calls unless `withoutSyncingToSearch` is used |
| Default `toArray()` shape | Works immediately, but includes all attributes (including sensitive ones) unless `toSearchableArray()` is overridden |
| Primary key as document ID | Simple, but breaks if primary keys change or are recycled across environments |
| Trait with default implementations | Easy onboarding, but method collisions if model already has methods like `searchableAs()` |

## Performance Considerations

- Indexing is I/O-bound when synchronous — each `save()` makes an HTTP call to the search engine.
- Queueing reduces web response time by moving index writes to background workers.
- The observer fires on every Eloquent save, including touch operations and relation updates. Use `withoutSyncingToSearch()` around batch operations.
- `searchable()` (collection upsert) is more efficient than individual saves for bulk indexing.

## Production Considerations

- **Always set `SCOUT_QUEUE=true` in production** unless using the database engine.
- **Monitor queue throughput** — a backlog on the scout queue means index lag.
- **Import existing data** with `php artisan scout:import` after adding the trait to existing models.
- **Test with `Scout::fake()`** to avoid hitting real search engines in CI.
- **Handle soft deletes explicitly** — Scout automatically excludes soft-deleted records from search results via the `__soft_deleted` attribute.

## Common Mistakes

- Not overriding `toSearchableArray()` — default includes all columns, often including sensitive or irrelevant data.
- Forgetting to configure queue before production — synchronous indexing creates a tight coupling between HTTP response time and search engine latency.
- Using `shouldBeSearchable()` without understanding it only gates observer-based syncs — calling `searchable()` directly bypasses it.
- Not importing existing records after adding the trait — the index remains empty until `scout:import` runs.

## Failure Modes

- **Queue backlog**: Index falls behind database updates. Results show stale data. Monitor the scout queue length.
- **Observer dead loop**: If `toSearchableArray()` triggers a model save (e.g., updating a `last_indexed_at` timestamp), it can cause infinite recursion. Use `saveQuietly()` for internal bookkeeping.
- **Serialization errors**: If `toSearchableArray()` returns non-serializable data (e.g., resource handles, binary blobs), the queue job may fail.

## Ecosystem Usage

- Every Scout-compatible Laravel application uses this trait.
- It's used in production by thousands of applications from small blogs to enterprise platforms.
- The trait pattern has been stable since Scout v1 (Laravel 5.3) and is unlikely to change.

## Related Knowledge Units

- K005 (toSearchableArray customization)
- K007 (shouldBeSearchable)
- K008 (withoutSyncingToSearch)
- K009 (scout:import / flush)
- K017 (Soft delete handling)

## Research Notes

Source: Laravel 13.x Scout documentation (https://laravel.com/docs/13.x/scout). The Searchable trait has maintained the same API since Scout v1. The trait's observer mechanism was refactored in Scout v10 to use Laravel's native observer system rather than custom event listeners, improving compatibility with model event caching.
