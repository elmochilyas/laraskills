| Metadata | |
|---|---|
| KU ID | K027 |
| Subdomain | search-ux-and-analytics |
| Topic | Meilisearch Faceted Search |
| Source | Meilisearch Docs |
| Maturity | Stable |

## Overview

Meilisearch faceted search provides filterable attributes with distribution counts. Facets are declared in `filterableAttributes` index settings. Meilisearch supports two types of facets: filter facets (for filtering results) and distribution facets (for displaying counts). Facet counts are returned alongside search results, enabling interactive filter UIs.

## Core Concepts

- **Filterable Attributes**: Fields declared as filterable in index settings.
- **Distribution Facets**: Return counts of how many results match each facet value.
- **Facet Filtering**: Narrow results by selecting facet values.
- **Facet Stats**: Min, max, and sum for numeric facet attributes.
- **Facet Search**: Search within facet values for large lists.

## When To Use

- E-commerce category/brand/price filtering
- Any UI with interactive drill-down filters
- Search results needing count-based facet display

## When NOT To Use

- Very small result sets (users can scroll through all)
- Non-filterable search (pure keyword search)

## Best Practices

1. **Declare all filterable attributes**: Configure in `filterableAttributes` before indexing.
2. **Limit distribution facets**: Show only the most relevant facets to avoid overwhelming users.
3. **Use facet search**: For facet values with 100+ options.
4. **Order facets by count**: Display most popular facet values first.
5. **Combine with sortable attributes**: Allow sorting within filtered results.

## Related Topics

- K024 (Meilisearch filterable/sortable attributes)
- K030 (Meilisearch ranking rules)
- K066 (Faceted search implementation)

## AI Agent Notes

- Facet counts are returned automatically when attributes are declared filterable.
- Use distribution facets for count display, filter facets for drill-down filtering.
- For agents: declare filterable attributes; use checkbox/radio UI for facet selection; update facet counts on filter change.

## Verification

- [ ] filterableAttributes configured for facet fields
- [ ] Facet counts returned with search results
- [ ] Facet filtering implemented in UI
- [ ] Facet stats configured for numeric attributes
- [ ] Facet search enabled for large value lists
