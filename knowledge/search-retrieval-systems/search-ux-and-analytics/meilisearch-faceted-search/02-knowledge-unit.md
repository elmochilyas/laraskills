# Knowledge Unit: Meilisearch Faceted Search

## Metadata

- **ID:** K027
- **Subdomain:** Search UX & Analytics
- **Source:** Meilisearch Docs
- **Maturity:** Stable
- **Laravel Relevance:** Distribution facets

## Executive Summary

Meilisearch faceted search enables attribute-based navigation and filtering with facet counts. Any `filterableAttributes` field automatically becomes available for faceted search. Meilisearch returns the distribution of values for each facet alongside search results, enabling drill-down UIs.

## Core Concepts

- **Facet Distribution**: Meilisearch returns a count of documents per facet value for the current search query.
- **Filterable = Facetable**: Any attribute declared as `filterableAttributes` automatically supports faceted search.
- **Facet Counts**: Reflect the current query + active filters (except the specific facet being counted).
- **Facet Search**: Search within facet values (e.g., typing "El" to find "Electronics" in the category facet).

## Internal Mechanics

Meilisearch computes facet counts during query processing by analyzing the inverted index entries for matching documents. The `facetsDistribution` parameter specifies which facets to return counts for. Counts are computed from the set of documents matching the search query (minus filters on that facet). Meilisearch returns these counts alongside search results in a single response.

## Patterns

- **Category drill-down**: Product categories with counts, enabling navigation.
- **Price range facets**: Pre-defined brackets with counts.
- **Multi-select faceting**: Allow users to select multiple values within a facet.
- **Zero-count suppression**: Meilisearch automatically omits values with zero results.

## Architectural Decisions

Meilisearch's decision to make any filterable attribute automatically facetable simplifies the developer experience. There's no separate "facet declaration" step — if you declare it as filterable, you can request facet counts.

## Tradeoffs

- Simplicity: No separate facet configuration needed. Less control compared to engines with separate facet settings.
- Performance: Facet counts add query-time overhead proportional to the number of facet values.
- High-cardinality facets: Fields with thousands of unique values may have slower facet count computation.

## Performance Considerations

- Facet count computation is proportional to the number of matching documents × number of facets.
- High-cardinality facets (e.g., product names) significantly increase query latency.
- Limit facet count to 10-20 values per facet for UI and performance reasons.

## Production Considerations

- **Declare facets as `filterableAttributes`** in index settings.
- **Request only needed facets** via the `facetsDistribution` parameter.
- **Limit facet values**: Use `maxValuesPerFacet` in settings to cap returned values.
- **Cache facet-heavy queries**: If the same facets are requested repeatedly, cache the response.

## Common Mistakes

- Making every attribute filterable — wasted index space and slower queries.
- Not specifying `facetsDistribution` — counts are not returned by default.
- Expecting continuous range facets (e.g., price 0-100, 100-200) — Meilisearch requires explicit range definitions via filter rules.
- Not handling facet values with special characters — they should be URL-encoded in the UI.

## Failure Modes

- **Performance degradation**: Too many high-cardinality facets slow queries.
- **Stale counts**: If index is behind the database, facet counts may be inaccurate.
- **Missing facet values**: If `maxValuesPerFacet` is too low, some values are not returned.

## Ecosystem Usage

Standard in e-commerce Meilisearch implementations. Faceted search is a defining feature of modern product search UIs.

## Related Knowledge Units

- K023 (Meilisearch driver setup)
- K024 (Meilisearch filterable/sortable)
- K066 (Faceted search implementation)

## Research Notes

Source: Meilisearch docs. The filterable/facetable parity makes Meilisearch's approach simpler than Algolia's (separate facet settings) and Typesense's (schema-level `facet` flag). The tradeoff is less fine-grained control in advanced scenarios.


## Mental Models

- **Card Catalog**: Meilisearch is like an automated card catalog that updates instantly as new books arrive. Every field is indexed and searchable by default.
- **Ranking Dashboard**: Search ranking rules are like dials on a dashboard — you adjust proximity, typo tolerance, attribute weights, and recency to tune relevance.

