| Metadata | |
|---|---|
| KU ID | K038 |
| Subdomain | search-ux-and-analytics |
| Topic | Typesense Faceting |
| Source | Typesense Docs |
| Maturity | Stable |

## Overview

Typesense faceting enables attribute-based result filtering and count display. Facetable fields are declared in the collection schema with `facet: true`. Typesense returns facet counts for all declared facetable fields alongside search results. Facet queries support drill-down with dynamic count updates and facet-level search for large value lists.

## Core Concepts

- **Facet Counts**: Number of documents matching each facet value returned with search results.
- **Facet Filtering**: Narrow results by selecting facet values (applied as filter).
- **Facet Stats**: Min, max, sum of numeric facet values.
- **Facet Search**: Search within facet values when they are too many to display.
- **Facet Filter Strategy**: Exact match, contains, or exclude per facet value.

## When To Use

- E-commerce category/brand/price filtering
- Content filtering by tag, author, date
- Any search with structured metadata attributes

## When NOT To Use

- Pure keyword search without structured filtering
- Very small result sets

## Best Practices

1. **Declare facetable fields in schema**: Set `facet: true` for each filterable attribute.
2. **Limit facet display**: Show top 10 facet values to avoid overwhelming users.
3. **Use facet search**: Enable for facets with 100+ values.
4. **Order facets by count**: Most popular values first.
5. **Combine with sort**: Allow sorting within faceted search results.

## Related Topics

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K066 (Faceted search implementation)

## AI Agent Notes

- Facetable fields must be declared in the collection schema before indexing.
- Facet counts are returned automatically for all facetable fields.
- For agents: declare facet: true in schema for filterable attributes; implement drill-down UI; enable facet search for large value lists.

## Verification

- [ ] Facetable fields declared in collection schema
- [ ] Facet counts returned with search results
- [ ] Facet filtering working correctly
- [ ] Facet stats available for numeric fields
- [ ] Facet search enabled for large lists
