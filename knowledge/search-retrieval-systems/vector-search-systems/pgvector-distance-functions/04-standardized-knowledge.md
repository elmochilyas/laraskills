| Metadata | |
|---|---|
| KU ID | K043 |
| Subdomain | vector-similarity-search |
| Topic | pgvector Distance Functions |
| Source | pgvector Docs |
| Maturity | Stable |

## Overview

pgvector supports multiple distance functions for vector similarity search: L2 (Euclidean), cosine, inner product (dot product), L1 (Manhattan), Hamming, and Jaccard. Each distance function has different mathematical properties and is suited for different types of embeddings and use cases. The choice of distance function must match the embedding model's training objective.

## Core Concepts

- **L2 Distance** (`<->`): Euclidean distance — geometric distance between vectors.
- **Cosine Distance** (`<=>`): Cosine similarity — measures angle between vectors, ignores magnitude.
- **Inner Product** (`<#>`): Dot product — used when embeddings encode magnitude as importance.
- **L1 Distance**: Manhattan distance — sum of absolute differences, less sensitive to outliers.
- **Hamming Distance**: For binary vectors — count of differing bits.
- **Jaccard Distance**: For binary vectors — intersection over union.

## When To Use

- Cosine: Most common for text embeddings (OpenAI, BGE, E5, Cohere)
- L2: Image embeddings, when magnitude matters
- Inner Product: Embeddings trained with dot product loss (Word2Vec, GloVe)
- L1: High-dimensional sparse vectors, when robustness to outliers is needed
- Hamming/Jaccard: Binary vectors (pgvector `bit` type)
- Use whatever distance metric your embedding model was trained with

## When NOT To Use

- Using cosine when the embedding model was trained with inner product (mismatch reduces accuracy)
- Using L2 on normalized vectors (cosine and L2 produce same ordering for normalized vectors)
- Using Hamming on non-binary vectors (requires `bit` type)
- Mixing distance functions within the same index (must match index operator class)

## Best Practices

1. **Match the embedding model's training metric**: Most text embedding models use cosine similarity.
2. **Normalize vectors for cosine**: All major embedding models output normalized vectors.
3. **Create index with the matching operator class**: `vector_cosine_ops`, `vector_l2_ops`, `vector_ip_ops`.
4. **Use cosine as default**: Works well for most text embedding use cases.
5. **Benchmark alternatives**: Test multiple distance functions with your specific data and queries.

## Architecture Guidelines

- Index operator class must match the distance function: `vector_cosine_ops` for `<=>`, `vector_l2_ops` for `<->`, `vector_ip_ops` for `<#>`.
- Query using the corresponding operator: `ORDER BY embedding <=> $query_vec`.
- Bit type vectors use `bit_hamming_ops` or `bit_jaccard_ops`.
- For normalized embeddings, L2 and cosine have the same ordering — use L2 for faster computation.

## Performance Considerations

- L2 and cosine similar performance; inner product slightly faster.
- L1 distance is slower (absolute value computation).
- Hamming distance on `bit` vectors is very fast (hardware-optimized).
- Index operator class must match query operator for ANN search.

## Examples

```sql
-- Cosine similarity (most common for text embeddings)
SELECT id, embedding <=> '[0.1, 0.2, ...]' AS distance
FROM items ORDER BY distance LIMIT 10;

-- L2 distance
SELECT id, embedding <-> '[0.1, 0.2, ...]' AS distance
FROM items ORDER BY distance LIMIT 10;

-- Inner product (higher = more similar)
SELECT id, embedding <#> '[0.1, 0.2, ...]' AS similarity
FROM items ORDER BY similarity DESC LIMIT 10;
```

## Related Topics

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K044 (pgvector half-precision / binary / sparse)
- K070 (Laravel + pgvector via Eloquent)

## AI Agent Notes

- Cosine distance is the default for text embeddings (OpenAI, BGE, etc.).
- L2 and cosine produce the same ordering for normalized vectors.
- For agents: use cosine distance for text embeddings; always match the embedding model's training metric.

## Verification

- [ ] Distance function matches embedding model's training metric
- [ ] Index created with matching operator class
- [ ] Query operator matches index operator class
- [ ] Distance results are semantically meaningful
- [ ] Alternative distance functions benchmarked
