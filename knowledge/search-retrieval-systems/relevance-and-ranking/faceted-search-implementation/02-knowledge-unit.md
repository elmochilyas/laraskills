# Knowledge Unit: Faceted Search Implementation

## Metadata

- **ID:** K066
- **Subdomain:** Relevance & Ranking
- **Source:** Algolia / Meilisearch / General
- **Maturity:** Stable
- **Laravel Relevance:** Attribute-based drill-down

## Executive Summary

Faceted search allows users to filter and navigate search results by multiple dimensions (facets) simultaneously — e.g., filter products by category, price range, brand, and color. Facets include counts of matching documents per value. Implementation varies by engine: Meilisearch requires `filterableAttributes` declaration, Typesense requires `facet: true` in schema, Algolia uses `attributesForFaceting`.

## Core Concepts

- **Facet**: A dimension for filtering (e.g., "category", "brand", "size").
- **Facet Value**: A specific value within a facet (e.g., "Electronics" within "category").
- **Facet Count**: Number of documents matching a specific facet value.
- **Disjunctive Faceting**: Showing count for a facet value even when another facet is active.
- **Facet Search**: Searching within facet values (e.g., searching brands within "Br" to find "Braun").

## Internal Mechanics

Search engines pre-compute facet counts during indexing. At query time, the engine returns requested facet counts alongside search results. Meilisearch computes counts from its inverted index. Typesense uses its columnar storage. Algolia uses its dedicated faceting engine. Facet counts reflect the current search query plus any active filters (except the facet being counted, for disjunctive faceting).

## Patterns

- **Attribute drill-down**: Category browsing with count awareness.
- **Price range facets**: Pre-defined price brackets with counts.
- **Multi-select faceting**: Users can select multiple brands, showing combined count.
- **Hierarchical faceting**: Category > Subcategory > Product type with drill-down.

## Architectural Decisions

Faceted search requires engine support — it cannot be efficiently implemented at the application level (which would require counting documents per value). All three major Scout-supported engines support faceting natively, though configuration differs.

## Tradeoffs

| Engine | Facet Configuration | Strength |
|---|---|---|
| Meilisearch | `filterableAttributes` | Simple setup, automatic counts |
| Typesense | `facet: true` in schema | Fast, supports facet search |
| Algolia | `attributesForFaceting` | Most mature, hierarchical, disjunctive |

## Performance Considerations

- Facet counts are pre-computed during indexing — query-time cost is minimal.
- Many high-cardinality facets (e.g., product titles as facets) increase index size and query latency.
- Facet counts on filtered searches require re-computing counts for the current result set.

## Production Considerations

- **Limit high-cardinality facets**: Facets with thousands of unique values (e.g., "price" as continuous) should be bucketed.
- **Declare facets in advance**: Pre-configuration is required in all engines.
- **Cache facet-heavy queries**: Facet counts can be cached alongside search results.
- **Prioritize facets by business value**: Not all attributes need to be facets.

## Common Mistakes

- Making every attribute a facet — unnecessary index bloat and slower writes.
- Not declaring facets ahead of time — `where()` style filtering without facet counts.
- Showing zero-count facets — most engines suppress these by default, but custom implementations may show them.
- Expecting facet counts to update in real-time — they reflect the index state at query time.

## Failure Modes

- **Stale counts**: If the index is behind the database, facet counts may be inaccurate.
- **Performance degradation**: Many high-cardinality facets slow both indexing and queries.
- **Zero-count facets**: Facet values with no matching documents after filtering should be hidden.

## Ecosystem Usage

Universal in e-commerce search. Used in product catalogs, job boards, real estate listings, and any multi-attribute search application.

## Related Knowledge Units

- K027 (Meilisearch faceted search)
- K038 (Typesense faceting)
- K019 (Algolia index settings)
- K024 (Meilisearch filterable/sortable)

## Research Notes

Sources: Algolia docs, Meilisearch docs, Typesense docs. Faceted search is a defining feature of modern search UIs. All three engines support it natively. Facet selection and ordering is more of a UX design concern than a search engineering one.


## Mental Models

- **Prism Effect**: Faceted search is like shining white light through a prism — the single search query is split into colored dimensions (category, price, brand, rating) that users filter independently.
- **Library Drill-Down**: Think of browsing a library: first you pick fiction/nonfiction (facet), then genre (sub-facet), then author (sub-sub-facet). Each selection narrows the set.

