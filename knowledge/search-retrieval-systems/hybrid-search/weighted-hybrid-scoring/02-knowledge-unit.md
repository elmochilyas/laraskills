# Knowledge Unit: Weighted Hybrid Scoring

## Metadata

- **ID:** ku-00
- **Subdomain:** 07-hybrid-search
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Weighted Hybrid Scoring

## Executive Summary

Weighted hybrid scoring combines keyword and vector search scores using a weighted formula: score = a * normalized_keyword_score + (1-a) * vector_similarity. The a parameter controls the balance between keyword and semantic contributions. Unlike RRF, weighted fusion uses actual relevance scores, requiring normalization since different engines produce scores on different scales.

## Core Concepts

- **Alpha (a)**: Weight parameter controlling keyword vs vector balance (0 = pure vector, 1 = pure keyword)
- **Score Normalization**: Mapping scores to [0,1] range for comparability
- **Min-Max Normalization**: (score - min) / (max - min)
- **Z-Score Normalization**: (score - mean) / stddev
- **Sigmoid Normalization**: 1 / (1 + e^(-score)) for handling outliers

## Internal Mechanics

Standard implementation patterns for Weighted Hybrid Scoring.

## Patterns

- Standard patterns apply for Weighted Hybrid Scoring.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Weighted Hybrid Scoring.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K061 (RRF - Reciprocal Rank Fusion)
- - K062 (Cross-encoder re-ranking)
- - K002 (Keyword-vector fusion)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
