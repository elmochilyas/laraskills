# Knowledge Unit: makeAllSearchableUsing / makeSearchableUsing

## Metadata

- **ID:** K010
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Eager load for imports

## Executive Summary

`makeAllSearchableUsing()` and `makeSearchableUsing()` modify the Eloquent query used when bulk-indexing models via `scout:import` or `searchable()`. They are the primary mechanism for ensuring relationships are eagerly loaded during batch indexing, preventing N+1 queries per chunk.

## Core Concepts

- **makeAllSearchableUsing**: Modifies the query for `scout:import`. Receives the query builder and returns a modified version. Typically used to add `->with()` calls.
- **makeSearchableUsing**: Modifies the query when calling `searchable()` on query results. Same pattern.
- **Return Value**: Must return a query builder instance (Eloquent Builder or Relation).

## Internal Mechanics

Scout's import logic first gets the base query (`Model::query()`), passes it through `makeAllSearchableUsing()`, then chunks the results. Each chunk is passed to `toSearchableArray()` on each model. Without eager loading, each model's relationship access in `toSearchableArray()` triggers individual queries.

## Patterns

- **Eager load all relations used in `toSearchableArray()`**: `$query->with('author', 'category', 'tags')`.
- **Add global scope overrides**: `$query->withoutGlobalScopes()` if needed.
- **Select specific columns**: `$query->select(['id', 'title', 'body'])` for wide tables.

## Tradeoffs

- Eager loading increases memory per chunk but reduces total query count.
- Joining too many relations can make the query slow. Balance chunk size and relation count.

## Performance Considerations

- Without this, indexing 10K records with 3 relations creates 30K+ queries (N+1).
- With eager loading, chunk queries drop to chunkCount + 1 per relation.
- Memory per chunk scales with loaded data. Reduce chunk size if memory is constrained.

## Production Considerations

- **Always implement** `makeAllSearchableUsing()` if `toSearchableArray()` accesses relationships.
- **Test with production-sized data** to validate memory usage and import time.
- **Consider `makeSearchableUsing()`** for incremental `searchable()` calls, not just imports.

## Common Mistakes

- Forgetting to overload it — `scout:import` triggers N+1 queries.
- Eager loading relations not used in `toSearchableArray()` — wastes memory and slows queries.
- Using `with()` on relations that return huge collections — consider limiting or filtering nested relations.

## Failure Modes

- **Memory exhaustion**: Loading too many large relations across all rows in a chunk.
- **Query timeouts**: Complex relationship chains on large datasets.

## Ecosystem Usage

Standard practice for any Scout model with relationships accessed in `toSearchableArray()`.

## Related Knowledge Units

- K005 (toSearchableArray)
- K009 (scout:import / flush)

## Research Notes

Source: Laravel Scout docs. This method pattern follows Laravel's convention of providing query modification hooks for bulk operations, similar to `newQuery()` overrides.


## Mental Models

- **Mirror Reflection**: Index synchronization is like keeping a mirror reflection of your database in the search engine. Every change to the original must be reflected in the mirror.
- **Conveyor Belt**: Batch indexing is a conveyor belt — documents enter on one end (import), travel through processing, and emerge searchable on the other end.

## Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Primary search engine choice | Application scale and budget | Start with Meilisearch/Typesense for self-hosted; Algolia for managed |
| Single-engine vs hybrid | Comprehensive search quality | Hybrid (BM25 + vector) for production; single-engine for POC |
| Batch vs real-time indexing | Data freshness requirements | Batch for bulk loads; real-time queue for incremental updates |
| Embedding model selection | Quality vs latency budget | Larger models (text-embedding-3-large) for offline; distilled for real-time |
| Index schema design | Search relevance tuning | Index only searchable/filterable fields; avoid over-indexing |

