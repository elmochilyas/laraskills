# Knowledge Unit: Database Full Text Vs Dedicated

## Metadata

- **ID:** ku-00
- **Subdomain:** 02-database-fulltext-search
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Database Full Text Vs Dedicated

## Executive Summary

Scout offers two zero-infrastructure engines (database and collection) alongside three dedicated engine integrations (Meilisearch, Typesense, Algolia). The database engine leverages MySQL FULLTEXT or PostgreSQL GIN indexes. The collection engine uses PHP in-memory filtering. Dedicated engines run as separate servers. This KU compares when to use each approach.

## Core Concepts

- **Database Engine**: Uses MySQL FULLTEXT/PostgreSQL FTS with SearchUsingFullText/SearchUsingPrefix attributes
- **Collection Engine**: In-memory PHP filtering via Str::is() — development only
- **Dedicated Engines**: Separate search server (Meilisearch, Typesense, Algolia)
- **Scout Abstraction**: Same API regardless of engine, enabling gradual migration

## Internal Mechanics

Standard implementation patterns for Database Full Text Vs Dedicated.

## Patterns

- Standard patterns apply for Database Full Text Vs Dedicated.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Database Full Text Vs Dedicated.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K002 (Scout database engine)
- - K003 (Scout collection engine)
- - K023 (Meilisearch driver setup)
- - K033 (Typesense driver setup)
- - K018 (Algolia driver setup)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
