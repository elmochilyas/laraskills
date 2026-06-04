# Knowledge Unit: Pgvector Where Vector Similar To

## Metadata

- **ID:** ku-04
- **Subdomain:** 06-vector-search-systems
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Pgvector Where Vector Similar To

## Executive Summary

pgvector provides operators for vector similarity search: cosine distance (<=>), L2 distance (<->), and inner product (<#>). Combined with ORDER BY ... LIMIT for nearest neighbor search. Filtered ANN supports pre-filtering with WHERE clauses and iterative index scans for strict ordering.

## Core Concepts

- **Cosine Distance**: <=> — 1 - cosine similarity. Range [0,2]. Most common.
- **L2/Euclidean Distance**: <-> — straight-line distance. Use for magnitude-sensitive search.
- **Inner Product**: <#> — dot product. Use with normalized vectors for cosine equivalence.
- **Exact Search**: ORDER BY embedding <=> '[vec]' LIMIT 10 (no index, exact, O(n))
- **ANN Search**: With HNSW/IVFFlat index (approximate, fast)
- **Filtered ANN**: WHERE category = 'electronics' ORDER BY embedding <=> '[vec]' LIMIT 10

## Internal Mechanics

Standard implementation patterns for Pgvector Where Vector Similar To.

## Patterns

- Standard patterns apply for Pgvector Where Vector Similar To.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Pgvector Where Vector Similar To.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K041 (pgvector extension)
- - K043 (Distance functions)
- - K046 (Iterative index scans)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
