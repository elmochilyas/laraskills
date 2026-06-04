| Metadata | |
|---|---|
| KU ID | ku-03 |
| Subdomain | vector-similarity-search |
| Topic | pgvector Indexing (HNSW / IVFFlat) |
| Source | pgvector docs |
| Maturity | Stable |

## Overview

pgvector supports two ANN index types: IVFFlat (Inverted File with Flat Compression) and HNSW (Hierarchical Navigable Small World). HNSW provides better query performance (faster, higher recall) but slower build time and more memory. IVFFlat builds faster, uses less memory, but has lower recall at equivalent parameters.

## Core Concepts

- **IVFFlat**: Inverted file index with flat compression. Requires training (k-means clustering).
- **HNSW**: Hierarchical graph-based index. No training required. Self-tuning.
- **Build Time**: IVFFlat builds faster (O(n)), HNSW slower (O(n log n))
- **Query Speed**: HNSW is 2-10x faster than IVFFlat at equivalent recall
- **Recall Tradeoff**: HNSW achieves 99%+ recall, IVFFlat typically 90-95% at best

## When To Use

- HNSW: Production query performance needed, index fits in memory
- IVFFlat: Large datasets where build speed matters, memory constrained
- HNSW: Default choice for most production uses (v0.5.0+)

## When NOT To Use

- Exact search needed for small datasets (no index = exact)
- Continuous index rebuilds (HNSW rebuilds are slow)
- Memory-constrained environments (HNSW uses more RAM)

## Best Practices

1. **Use HNSW for production**: Better query performance and recall.
2. **Use IVFFlat for prototyping**: Faster build time for iteration.
3. **Tune ef_search**: Higher = better recall, slower queries (HNSW).
4. **Tune probes**: Higher = better recall, slower queries (IVFFlat).
5. **Rebuild periodically**: Indexes can degrade with insertions.

## Related Topics

- K041 (pgvector extension)
- K042 (Indexing)
- K013 (Search performance)

## AI Agent Notes

- HNSW is the default recommendation for production (v0.5.0+)
- IVFFlat is useful for rapid prototyping and large initial builds
- For agents: use HNSW for production, IVFFlat for development

## Verification

- [ ] Index type chosen (HNSW or IVFFlat)
- [ ] Index created with appropriate parameters
- [ ] ef_search/probes tuned
- [ ] Query performance measured
- [ ] Recall benchmarked against exact search
- [ ] Rebuild schedule determined
