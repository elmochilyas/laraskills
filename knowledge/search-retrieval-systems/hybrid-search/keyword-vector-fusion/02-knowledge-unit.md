# Knowledge Unit: Keyword Vector Fusion

## Metadata

- **ID:** ku-00
- **Subdomain:** 07-hybrid-search
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Keyword Vector Fusion

## Executive Summary

Keyword-vector fusion combines BM25/term-based retrieval with embedding-based semantic retrieval into a single ranked result set. Three primary fusion methods exist: Reciprocal Rank Fusion (RRF), weighted score combination, and cross-encoder re-ranking. Each offers different tradeoffs in simplicity, accuracy, and latency.

## Core Concepts

- **Dual Retrieval Paths**: Keyword index (inverted index, BM25) and vector index (ANN, cosine similarity)
- **RRF Fusion**: Rank-based, score = 1/(k + rank), sum across result sets
- **Weighted Fusion**: score = a * normalized_keyword_score + (1-a) * cosine_similarity
- **Cross-Encoder**: Second-pass model that jointly scores query-document pairs
- **Score Normalization**: Mapping different scoring scales to comparable ranges

## Internal Mechanics

Standard implementation patterns for Keyword Vector Fusion.

## Patterns

- Standard patterns apply for Keyword Vector Fusion.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Keyword Vector Fusion.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K061 (RRF - Reciprocal Rank Fusion)
- - K062 (Cross-encoder re-ranking)
- - K045 (pgvector + FTS hybrid)
- - K049 (Qdrant hybrid queries)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
