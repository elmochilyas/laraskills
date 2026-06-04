# Knowledge Unit: Pgvector Indexing Hnsw Ivfflat

## Metadata

- **ID:** ku-03
- **Subdomain:** 06-vector-search-systems
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Pgvector Indexing Hnsw Ivfflat

## Executive Summary

pgvector supports two ANN index types: IVFFlat (Inverted File with Flat Compression) and HNSW (Hierarchical Navigable Small World). HNSW provides better query performance (faster, higher recall) but slower build time and more memory. IVFFlat builds faster, uses less memory, but has lower recall at equivalent parameters.

## Core Concepts

- **IVFFlat**: Inverted file index with flat compression. Requires training (k-means clustering).
- **HNSW**: Hierarchical graph-based index. No training required. Self-tuning.
- **Build Time**: IVFFlat builds faster (O(n)), HNSW slower (O(n log n))
- **Query Speed**: HNSW is 2-10x faster than IVFFlat at equivalent recall
- **Recall Tradeoff**: HNSW achieves 99%+ recall, IVFFlat typically 90-95% at best

## Internal Mechanics

Standard implementation patterns for Pgvector Indexing Hnsw Ivfflat.

## Patterns

- Standard patterns apply for Pgvector Indexing Hnsw Ivfflat.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Pgvector Indexing Hnsw Ivfflat.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K041 (pgvector extension)
- - K042 (Indexing)
- - K013 (Search performance)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
