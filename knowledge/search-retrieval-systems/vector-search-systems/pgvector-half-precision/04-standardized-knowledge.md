| Metadata | |
|---|---|
| KU ID | K044 |
| Subdomain | vector-similarity-search |
| Topic | pgvector Half-Precision / Binary / Sparse Vectors |
| Source | pgvector Docs |
| Maturity | Stable |

## Overview

pgvector supports multiple vector storage formats beyond standard float32: halfvec (half-precision float16), bit (binary vectors for Hamming/Jaccard distance), and sparsevec (sparse vectors for bag-of-words representations). Each format offers different storage/accuracy tradeoffs: halfvec halves storage with minimal accuracy loss, bit provides 32x compression, and sparsevec enables keyword-aware vector search.

## Core Concepts

- **halfvec (float16)**: 16-bit floating point vectors — 50% storage reduction vs float32.
- **bit (binary)**: Binary vectors (0/1 bits) — 32x storage reduction, uses Hamming/Jaccard distance.
- **sparsevec**: Sparse vectors with only non-zero dimensions stored — efficient for bag-of-words.
- **Storage vs Accuracy**: Lower precision = less storage but potential accuracy loss.
- **Mixed Types**: Different vector types can coexist in the same table.

## When To Use

- halfvec: Large-scale deployments where storage cost is the primary constraint
- bit: Very large datasets where 32x compression is needed and Hamming distance is appropriate
- sparsevec: TF-IDF or bag-of-words style vector representations
- halfvec: When embedding model outputs can be quantized to float16 with minimal quality loss

## When NOT To Use

- High-recall requirements (<1% accuracy loss unacceptable)
- Embedding models that output float32 and cannot be quantized without significant quality loss
- Applications that don't need storage optimization (small datasets)
- When using distance metrics not supported by the vector type

## Best Practices

1. **Benchmark accuracy loss**: Compare float32 vs halfvec/binary on your specific dataset before committing.
2. **Use halfvec as default optimization**: 50% storage savings with typically <1% accuracy loss.
3. **Consider re-ranking**: Use compressed vectors for ANN search, then re-rank with original float32.
4. **Match distance function to vector type**: Hamming for bit, cosine for halfvec, L2 for sparsevec.
5. **Document the tradeoff**: Ensure team understands the precision implications.

## Architecture Guidelines

- Define column type per use case: `halfvec(1536)`, `bit(256)`, or `sparsevec(10000)`.
- Index different types with appropriate index operator classes.
- Use `vector_dims()` to inspect vector dimensions regardless of type.
- Cast between types if needed: `my_embedding::vector` or `my_embedding::halfvec(1536)`.

## Performance Considerations

- halfvec: 50% less memory, ~20% faster scans, <1% recall loss typically.
- bit: 32x less memory, supports Hamming distance (very fast).
- sparsevec: Efficient for high-dimensional sparse data, good for keyword matching.
- Index on compressed vectors is smaller and faster to search.

## Related Topics

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K043 (pgvector distance functions)
- K047 (pgvector binary quantization + re-ranking)

## AI Agent Notes

- halfvec is the best starting point for storage optimization — 50% savings with minimal impact.
- Binary quantization (bit) is appropriate for very large datasets at the cost of recall.
- For agents: use halfvec by default for production storage optimization; benchmark accuracy loss before deploying.

## Verification

- [ ] Vector type selected (halfvec/bit/sparsevec) based on requirements
- [ ] Storage savings measured vs float32 baseline
- [ ] Accuracy loss benchmarked for selected type
- [ ] Re-ranking strategy implemented if using compressed vectors
- [ ] Index created with correct operator class for vector type
