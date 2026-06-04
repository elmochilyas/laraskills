# Knowledge Unit: Postgresql Full Text

## Metadata

- **ID:** ku-00
- **Subdomain:** 02-database-fulltext-search
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Postgresql Full Text

## Executive Summary

PostgreSQL provides advanced full-text search via 	svector (document representation) and 	squery (query representation) types, combined with 	s_rank() for relevance ranking and 	s_headline() for result highlighting. GIN indexes accelerate tsvector searches. PostgreSQL's FTS offers configurable text search configurations (dictionaries, stemming, stop words) per language.

## Core Concepts

- **tsvector**: A sorted list of lexemes (normalized words) with positional information
- **tsquery**: A boolean query against tsvector using & (AND), | (OR), ! (NOT), <-> (followed by)
- **GIN Index**: Generalized Inverted Index for accelerating tsvector @@ tsquery operations
- **Text Search Configuration**: Language-specific dictionaries, stemmers, stop words
- **ts_rank / ts_rank_cd**: Relevance ranking functions (BM25-based)
- **ts_headline**: Snippet generation with search term highlighting

## Internal Mechanics

Standard implementation patterns for Postgresql Full Text.

## Patterns

- Standard patterns apply for Postgresql Full Text.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Postgresql Full Text.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K041 (pgvector extension)
- - K045 (pgvector + FTS hybrid)
- - K015 (SearchUsingFullText attribute)
- - K016 (SearchUsingPrefix attribute)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
