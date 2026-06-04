# Knowledge Unit: Hybrid Search Vector Keyword

## Metadata

- **ID:** ku-11
- **Subdomain:** 06-vector-search-systems
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Hybrid Search Vector Keyword

## Executive Summary

Hybrid search combining vector and keyword retrieval merges semantic understanding with exact match precision. This KU focuses on the vector side of hybrid search — how embedding vectors integrate with BM25/full-text for hybrid retrieval. Applies to pgvector + FTS, Qdrant dense + sparse, and similar patterns.

## Core Concepts

- **Dense + Sparse**: Dense vectors for semantics, sparse vectors/BM25 for keywords
- **Fusion Point**: Application-level, engine-level, or database-level
- **RRF Fusion**: Rank-based combination, no score normalization needed
- **Scoring Balance**: a parameter controls keyword vs vector influence
- **Use Cases**: Code search (exact + semantic), e-commerce (product name + concept), RAG

## Internal Mechanics

Standard implementation patterns for Hybrid Search Vector Keyword.

## Patterns

- Standard patterns apply for Hybrid Search Vector Keyword.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Hybrid Search Vector Keyword.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K045 (pgvector + FTS hybrid)
- - K049 (Qdrant hybrid queries)
- - K061 (RRF)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
