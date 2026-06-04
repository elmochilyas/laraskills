# Knowledge Unit: Scout paginate

## Metadata

- **ID:** K012
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Paginated search results

## Executive Summary

Scout's `paginate()` method wraps search results in a Laravel `LengthAwarePaginator` instance, providing familiar pagination for search results. Each page triggers a new search engine call. This integrates cleanly with Blade pagination directives and frontend pagination components.

## Core Concepts

- **Engine-Side Pagination**: The search engine handles offset/limit internally, returning only the requested page.
- **LengthAwarePaginator**: Provides total count, page links, and cursor tracking compatible with `@paginate`.
- **Per-Page Default**: 15 results per page. Configurable via `paginate(20)`.
- **Total Count Accuracy**: Most engines return an approximate total count. Meilisearch and Typesense provide exact counts for reasonable page depths.

## Internal Mechanics

Scout's engine adapter translates `paginate(perPage, pageName, page)` into engine-specific offset/limit parameters. It executes the search, counts results, and constructs a `LengthAwarePaginator`. The raw search results are hydrated into Eloquent models using the engine's `map()` method (which fetches model IDs and queries the database).

## Patterns

- **Simple pagination**: `Model::search($query)->paginate(20)`.
- **With filters**: `Model::search($query)->where('status', 'active')->paginate(20)`.
- **Custom page**: `paginate(20, 'page', request()->get('page', 1))`.

## Tradeoffs

- Each pagination page is a separate search engine query. Deep pagination (page 100+) is expensive.
- Total counts can be expensive on engines that must scan many documents. Meilisearch handles this efficiently; others may approximate.

## Performance Considerations

- Deep pagination (>100 pages) should be avoided or replaced with infinite scroll.
- `paginate()` triggers a count query + a results query to the engine.
- Cache popular search pages: `Cache::remember("search.$query.page.$page", 300, fn() => ...)`.

## Production Considerations

- **Limit maximum page depth** to prevent abuse/scans: `min($request->page, 100)`.
- **Use cursor-based pagination** for real-time search-as-you-type UIs.
- **Cache paginated results** for common queries.

## Common Mistakes

- Using `paginate()` without limits on user-supplied page numbers — allows deep pagination scans.
- Not caching — identical search queries hit the engine each time.
- Expecting exact total counts from all engines (some approximate).

## Failure Modes

- **Engine timeouts on deep pagination**: Offset past the engine's soft limit returns empty.
- **Inconsistent total count**: If records are being indexed during pagination, the total may shift between page loads.

## Ecosystem Usage

Universal standard for displaying Laravel Scout search results with pagination controls.

## Related Knowledge Units

- K001 (Searchable trait)
- K011 (Scout where clauses)
- K063 (Search query caching)

## Research Notes

Source: Laravel Scout docs. The paginate method follows Laravel's standard pagination contract, making it compatible with existing pagination views and API resource collections.


## Mental Models

- **Central Switchboard**: Laravel Scout is like a switchboard operator — you tell it which model to search and which engine to use, and it connects them without you handling the wiring.
- **Adapter Pattern**: Scout is the universal power outlet adapter. Your application speaks one language (Scout), and Scout translates to whatever search engine you plug in.

## Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Primary search engine choice | Application scale and budget | Start with Meilisearch/Typesense for self-hosted; Algolia for managed |
| Single-engine vs hybrid | Comprehensive search quality | Hybrid (BM25 + vector) for production; single-engine for POC |
| Batch vs real-time indexing | Data freshness requirements | Batch for bulk loads; real-time queue for incremental updates |
| Embedding model selection | Quality vs latency budget | Larger models (text-embedding-3-large) for offline; distilled for real-time |
| Index schema design | Search relevance tuning | Index only searchable/filterable fields; avoid over-indexing |

