# Knowledge Unit: Laravel Hybrid Implementation

## Metadata

- **ID:** ku-00
- **Subdomain:** 07-hybrid-search
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Laravel Hybrid Implementation

## Executive Summary

Implementing hybrid search in Laravel requires combining Scout (for keyword/full-text search) with a vector search capability (pgvector, Qdrant, Meilisearch vector). Fusion happens at the application level (PHP) or engine level (native hybrid). No first-party Scout driver for hybrid search exists yet; implementations are custom.

## Core Concepts

- **Scout + pgvector**: Scout for keyword queries, raw SQL/pgvector-php for vector queries
- **Scout + Qdrant**: Scout for keyword queries, Qdrant PHP SDK for vector queries
- **Single Engine Hybrid**: Meilisearch hybrid, Typesense hybrid, Qdrant hybrid (native fusion)
- **Application-Level Fusion**: Custom PHP service queries both paths and fuses results
- **Custom Scout Engine**: Build a single engine that queries both backends

## Internal Mechanics

Standard implementation patterns for Laravel Hybrid Implementation.

## Patterns

- Standard patterns apply for Laravel Hybrid Implementation.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Laravel Hybrid Implementation.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K028 (Meilisearch hybrid search)
- - K045 (pgvector + FTS hybrid)
- - K049 (Qdrant hybrid queries)
- - K061 (RRF - Reciprocal Rank Fusion)
- - K014 (Custom engine development)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
