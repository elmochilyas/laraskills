| Metadata | |
|---|---|
| KU ID | ku-08 |
| Subdomain | relevance-and-ranking |
| Topic | Faceted Search |
| Source | Algolia / Meilisearch / Typesense Docs |
| Maturity | Stable |

## Overview

Faceted search provides drill-down navigation by displaying attribute value counts that update with each filter selection. Facets (e.g., category, brand, price range, color) help users refine search results interactively. Filter-only facets filter without displaying counts; display facets show counts for each value.

## Core Concepts

- **Facet**: Categorical or numerical attribute used for filtering
- **Facet Count**: Number of matching documents per facet value
- **Filter-Only Facet**: Applies filter without showing counts
- **Display Facet**: Shows facet values with counts
- **Disjunctive Faceting**: OR logic across facet categories (e.g., any brand AND any size)
- **Conjunctive Faceting**: AND logic within facet categories

## When To Use

- E-commerce product filtering
- Content platform category navigation
- Any application with structured attributes for drill-down
- Large result sets needing refinement

## When NOT To Use

- Single-attribute filtering only (use simple filters)
- Very small datasets (faceting overhead not justified)
- Non-structured content without attribute metadata

## Best Practices

1. **Declare filterable attributes**: Ensures facets work with Scout's where().
2. **Limit facet value count**: Display top N values, aggregate rest.
3. **Use disjunctive faceting**: More flexible user experience.
4. **Facet on indexed fields**: Non-indexed facet computation is expensive.
5. **Test with realistic cardinality**: High-cardinality facets (hundreds of brands) need special handling.

## Related Topics

- K024 (Meilisearch filterable/sortable)
- K027 (Meilisearch faceted search)
- K038 (Typesense faceting)

## AI Agent Notes

- Faceted search is standard for e-commerce and content platforms
- All three dedicated engines support faceted search
- For agents: implement facets on most-filtered attributes first

## Verification

- [ ] Facet attributes declared filterable
- [ ] Facet counts render in UI
- [ ] Multi-facet filtering works (AND/OR correctly)
- [ ] High-cardinality facets handled
- [ ] Facet selection refines results correctly
