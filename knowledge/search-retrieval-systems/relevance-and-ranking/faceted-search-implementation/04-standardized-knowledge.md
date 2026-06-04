| Metadata | |
|---|---|
| KU ID | K066 |
| Subdomain | relevance-and-ranking |
| Topic | Faceted Search Implementation |
| Source | Algolia / Meilisearch / Industry |
| Maturity | Stable |

## Overview

Faceted search allows users to drill down into search results by selecting attribute-based filters (categories, price ranges, brands, ratings). Facets are pre-computed counts of how many results match each filter value. When a user selects a facet, the search results are filtered, and remaining facet counts update dynamically. This creates an interactive exploration experience.

## Core Concepts

- **Facet**: An attribute available for filtering (category, brand, price range).
- **Facet Value**: A specific value within a facet (e.g., "Electronics" for category).
- **Facet Count**: Number of results matching each facet value.
- **Filter Facets**: Facets used only for filtering (no count display).
- **Disjunctive Faceting**: OR logic within a facet, AND logic across facets.
- **Facet Ordering**: By count, by alphabetical, or custom order.

## When To Use

- E-commerce category/brand/price filtering
- Content sites with category/tag/author drill-down
- Any application with structured metadata alongside text search
- Large catalogs where users need to narrow results interactively

## When NOT To Use

- Very small result sets (users can scroll through all results)
- Simple search where filters aren't needed
- Applications without structured metadata attributes

## Best Practices

1. **Declare facetable attributes**: Configure in engine settings (Meilisearch: `filterableAttributes`, Algolia: `attributesForFaceting`).
2. **Limit facet count**: Show top 10 facet values to avoid overwhelming users.
3. **Use facet search**: Allow users to search within facet values for large lists.
4. **Implement dynamic updates**: Update facet counts when filters are applied.
5. **Order facets strategically**: Most important facets first (category, price, brand).

## Architecture Guidelines

- Configure facet attributes in the search engine, not in application code.
- For Scout: use engine-specific settings in config or callback API.
- Facet counts are returned alongside search results from the engine.
- Implement UI components using Livewire, Alpine, or Vue for real-time updates.

## Performance Considerations

- Facet counts add minimal overhead to search queries (<5ms).
- Too many facet attributes (20+) may impact index build time.
- Dynamic facet updates require a new search query per filter change.
- Non-disjunctive faceting (AND within facet) is more performant than disjunctive.

## Related Topics

- K024 (Meilisearch filterable/sortable attributes)
- K027 (Meilisearch faceted search)
- K038 (Typesense faceting)
- K019 (Algolia index settings)

## AI Agent Notes

- Faceted search transforms search from linear to exploratory.
- Configure facet attributes in engine settings before indexing.
- For agents: declare all filterable attributes as facets; limit visible facet counts; implement dynamic updates via Livewire/Alpine.

## Verification

- [ ] Facetable attributes declared in engine settings
- [ ] Facet counts returned with search results
- [ ] Dynamic facet updates on filter selection
- [ ] Facet ordering configured (count or alphabetical)
- [ ] UI implements interactive facet drill-down
