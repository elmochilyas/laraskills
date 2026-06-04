# Knowledge Unit: Index Schema Design

## Metadata

- **ID:** ku-01
- **Subdomain:** 01-laravel-scout-foundation
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Index Schema Design

## Executive Summary

Index schema design defines what data goes into the search index, how it's structured, and which fields are searchable, filterable, sortable. Scout's 	oSearchableArray() method controls the indexed payload. Schema differs per engine: Meilisearch is schema-free, Typesense requires explicit field types, Algolia combines both approaches.

## Core Concepts

- **toSearchableArray()**: Defines the fields sent to the search index per model
- **searchableAs()**: Custom index name per model
- **Filterable Attributes**: Fields usable for WHERE/filter clauses
- **Sortable Attributes**: Fields usable for ORDER BY
- **Schema-Free (Meilisearch)**: Fields inferred from first indexed document
- **Schema-Enforced (Typesense)**: Explicit field type declaration required

## Internal Mechanics

Standard implementation patterns for Index Schema Design.

## Patterns

- Standard patterns apply for Index Schema Design.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Index Schema Design.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K005 (toSearchableArray)
- - K006 (searchableAs)
- - K024 (Filterable/sortable attributes)
- - K034 (Typesense collection schemas)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
