# Knowledge Unit: Typesense Faceting

## Metadata

- **ID:** K038
- **Subdomain:** Search UX & Analytics
- **Source:** Typesense Docs
- **Maturity:** Stable
- **Laravel Relevance:** Facet counts and filtering

## Executive Summary

Typesense faceting enables attribute-based navigation with facet counts. Facets are declared at the collection schema level by setting `"facet": true` on specific fields. Typesense supports facet counts, facet search (filtering facet values by prefix), and drill-down navigation.

## Core Concepts

- **Schema Declaration**: Set `"facet": true` on the field definition in the collection schema.
- **Facet Counts**: Returned alongside search results via the `facet_by` parameter.
- **Facet Search**: Filter facet values by prefix for autocomplete-style facet selection.
- **Referenced Facet Counts**: Correct counts when multiple facets are selected (disjunctive counting).

## Internal Mechanics

Typesense pre-computes facet statistics during indexing. At query time, the `facet_by` parameter specifies which facets to return counts for. Typesense computes counts from the documents matching the current query (including active filters on other facets, but excluding filters on the counted facet). This ensures accurate "drill-down" counts.

## Patterns

- **Category browsing**: Facet count on product categories.
- **Multi-facet drill-down**: Brand + category + price range facets simultaneously.
- **Facet search**: Allow users to type within a facet to find specific values.

## Architectural Decisions

Typesense requires explicit `facet: true` declaration at schema creation time. This differs from Meilisearch (where filterable = facetable automatically) and Algolia (separate facet configuration). The explicit declaration allows Typesense to optimize storage for faceted fields.

## Tradeoffs

| Engine | Facet Declaration | Flexibility |
|---|---|---|
| Typesense | Schema-level `facet: true` | Fast, optimized, but schema changes need re-creation |
| Meilisearch | Any filterable attribute | Flexible, no separate step |
| Algolia | `attributesForFaceting` | Most configurable (hierarchical, disjunctive) |

## Performance Considerations

- Facet counts on low-cardinality fields (categories, brands) are near-instant.
- High-cardinality facets (thousands of values) increase query latency.
- Typesense's in-memory storage makes facet count computation fast.

## Production Considerations

- **Declare facet fields at collection creation** — cannot add facets later without re-creating the collection.
- **Limit facet values** via the `max_facet_values` parameter.
- **Use facet search** for facets with many values (e.g., brands, product names).
- **Cache facet-heavy queries** if the same facets are requested repeatedly.

## Common Mistakes

- Not declaring `facet: true` on fields used for faceting — counts are not returned.
- Making every field a facet — unnecessary overhead for fields with unique values per document.
- Expecting Scout to request facet counts — requires callback API or direct Typesense query.
- Not handling facet values with special characters in URLs.

## Failure Modes

- **Schema lock-in**: Adding a facet to an existing collection requires re-creation.
- **Slow queries**: Too many high-cardinality facets degrade performance.
- **Missing counts**: `facet_by` parameter not specified — counts are not returned by default.

## Ecosystem Usage

Standard in Typesense-based search implementations for faceted navigation. Common in e-commerce and content directories.

## Related Knowledge Units

- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K066 (Faceted search implementation)
- K027 (Meilisearch faceted search)

## Research Notes

Source: Typesense docs. Typesense's facet declaration at the schema level ensures optimal internal storage for faceted fields. The need to declare facets upfront is part of Typesense's schema-first philosophy.


## Mental Models

- **Lightning Rod**: Typesense is designed for sub-50ms responses. Every architectural decision prioritizes speed, like a lightning rod channeling energy with minimal resistance.
- **Schema-on-Write**: Unlike schema-on-read databases, Typesense enforces structure at write time, like pre-sorting mail before delivery rather than sorting at the mailbox.

