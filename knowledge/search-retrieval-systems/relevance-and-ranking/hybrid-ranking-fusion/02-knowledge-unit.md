# Knowledge Unit: Hybrid Ranking Fusion

## Metadata

- **ID:** ku-03
- **Subdomain:** 08-relevance-and-ranking
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Hybrid Ranking Fusion

## Executive Summary

Hybrid ranking fusion combines keyword (BM25) and vector (embedding) relevance scores into a single ranking. Methods: RRF (Reciprocal Rank Fusion), weighted score fusion, and cross-encoder re-ranking. The right fusion strategy depends on latency budget, accuracy requirements, and available infrastructure.

## Core Concepts

- **RRF**: Rank-based fusion, score = 1/(k+rank), no score normalization needed
- **Weighted**: Score = a × keyword + (1-a) × vector, requires normalization
- **Cross-encoder**: Neural model scoring query-document pairs, best accuracy, slowest
- **Two-Stage**: Coarse retrieval ? fusion ? re-ranking (optional)

## Internal Mechanics

Standard implementation patterns for Hybrid Ranking Fusion.

## Patterns

- Standard patterns apply for Hybrid Ranking Fusion.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Hybrid Ranking Fusion.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K061 (RRF)
- - K062 (Cross-encoder re-ranking)
- - K045 (pgvector + FTS hybrid)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
