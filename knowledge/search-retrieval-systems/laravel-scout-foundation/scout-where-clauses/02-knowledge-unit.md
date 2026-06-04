# Knowledge Unit: Scout where / whereIn / whereNotIn

## Metadata

- **ID:** K011
- **Subdomain:** Search Indexing & Synchronization
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Basic filtering

## Executive Summary

Scout's `where()`, `whereIn()`, and `whereNotIn()` methods enable filtered search queries that combine full-text search with structured attribute filtering. These are applied alongside the text query to narrow results based on indexed fields. They operate on the search engine side (not database side), filtering before results are returned.

## Core Concepts

- **Engine-Side Filtering**: `where` clauses are passed to the search engine, which applies them during search. This is more efficient than post-query filtering in PHP.
- **Requires Declared Attributes**: For Meilisearch and Typesense, filtered fields must be declared as `filterableAttributes` or defined in the collection schema beforehand.
- **No Joins**: Filters apply to the indexed document, not related tables. Denormalize filterable fields into `toSearchableArray()`.

## Internal Mechanics

Scout translates `where()` calls into engine-specific filter expressions. For Meilisearch, it generates `status = active` filter strings. For Typesense, it uses the `filter_by` parameter. The engine applies the filter during the search operation, combining it with the text query.

## Patterns

- **Filter on indexed attributes**: `Product::search('shoes')->where('status', 'active')->get()`.
- **Combined filters**: Chain multiple `where()` calls. Conditionally apply based on request input.
- **Pre-declare filterable attributes** in the engine configuration (scout.php or engine dashboard).

## Architectural Decisions

Scout chose to implement filtering at the engine layer (not application layer) because post-query filtering loses the performance benefits of the search engine's optimized indexed filtering.

## Tradeoffs

- Engine-side filtering is fast but limited to indexed document fields. Relational filtering requires denormalization.
- Not all engines support the same filter operators. `whereNotIn` may have engine-specific limitations.
- Filtering on non-declared fields will be silently ignored or cause errors depending on the engine.

## Performance Considerations

- Filtering on indexed fields is near-instant (O(log n) lookups).
- Filtering on non-indexed fields may cause full scan.
- Very selective filters (matching <0.1% of documents) benefit from the search engine's inverted index.

## Production Considerations

- **Declare all filterable attributes** in the engine configuration before use.
- **Test filter performance** with production-sized datasets.
- **Use `whereIn()`** for multi-value filters (category IDs, statuses).

## Common Mistakes

- Filtering on fields not in `toSearchableArray()` — they don't exist in the index.
- Forgetting to declare `filterableAttributes` for Meilisearch.
- Using `where()` with the database engine on non-indexed columns.

## Failure Modes

- Engine returns errors for filters on undeclared attributes.
- Empty results when filters are too restrictive — no feedback mechanism.

## Ecosystem Usage

Essential query pattern across all Scout engines. Used by virtually all production Scout implementations for status filtering, category drilling, and scope limiting.

## Related Knowledge Units

- K001 (Searchable trait)
- K012 (Scout paginate)
- K024 (Meilisearch filterable/sortable)

## Research Notes

Source: Laravel Scout docs. The underlying engine adapters translate Scout's filter API differently per engine. This abstraction means some filter operators work only on specific engines.


## Mental Models

- **Central Switchboard**: Laravel Scout is like a switchboard operator — you tell it which model to search and which engine to use, and it connects them without you handling the wiring.
- **Adapter Pattern**: Scout is the universal power outlet adapter. Your application speaks one language (Scout), and Scout translates to whatever search engine you plug in.

