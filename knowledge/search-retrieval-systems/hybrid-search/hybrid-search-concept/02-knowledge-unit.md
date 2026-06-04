# Knowledge Unit: Hybrid Search Concept

## Metadata

- **ID:** ku-00
- **Subdomain:** 07-hybrid-search
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Hybrid Search Concept

## Executive Summary

Hybrid search combines keyword-based (BM25, full-text) and semantic (vector embedding) retrieval to get the best of both approaches. Keyword search excels at exact matches, proper nouns, and rare terms. Vector search excels at conceptual matches, synonyms, and understanding intent. Fusion algorithms combine results into a single ranked list.

## Core Concepts

- **Keyword Retrieval**: BM25, TF-IDF, or full-text search — exact term matching
- **Semantic Retrieval**: Vector similarity search — conceptual meaning matching
- **Fusion**: Combining two result sets into one — RRF, weighted sum, or cross-encoder
- **Complementary Strengths**: Keyword handles specificity, vector handles semantics
- **Fusion Points**: Engine-level (native), database-level (SQL), application-level (PHP), microservice-level

## Internal Mechanics

Standard implementation patterns for Hybrid Search Concept.

## Patterns

- Standard patterns apply for Hybrid Search Concept.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Hybrid Search Concept.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K045 (pgvector + FTS hybrid)
- - K049 (Qdrant hybrid queries)
- - K061 (RRF - Reciprocal Rank Fusion)
- - K062 (Cross-encoder re-ranking)
- - K028 (Meilisearch hybrid search)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
