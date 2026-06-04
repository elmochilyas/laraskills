| Metadata | |
|---|---|
| KU ID | ku-02 |
| Subdomain | relevance-and-ranking |
| Topic | Vector Similarity Relevance |
| Source | Industry / Academic |
| Maturity | Stable |

## Overview

Vector similarity relevance measures how close an embedding vector is to a query embedding. Common distance metrics: cosine similarity, Euclidean (L2) distance, and inner (dot) product. Higher similarity between query and document vectors implies conceptual relevance. This enables semantic matching beyond keyword overlap.

## Core Concepts

- **Cosine Similarity**: Measures angle between vectors (-1 to 1, 1 = identical direction)
- **Euclidean Distance**: Straight-line distance (0 = identical)
- **Dot Product**: Scalar product (magnitude- and direction-dependent)
- **Normalization**: Most models produce unit vectors (length 1) for cosine compatibility
- **Semantic Matching**: Similar vectors ≈ similar concepts, even with different vocabulary

## When To Use

- Semantic search where conceptual matching matters
- RAG pipelines for retrieving context
- Multi-language search (vectors cross language boundaries)
- Synonym / paraphrase matching

## When NOT To Use

- Exact keyword match required (proper nouns, codes, IDs)
- Small datasets where keyword search already works well
- Limited compute for embedding generation

## Best Practices

1. **Normalize embeddings**: Ensures cosine similarity = dot product consistency.
2. **Match distance to training**: Use distance metric the embedding model was trained with.
3. **Test multiple metrics**: Cosine vs L2 may behave differently for your data.
4. **Use cosine similarity as default**: Works well with most modern embedding models.
5. **Scale for indexing**: Different metric may require different index types (HNSW, IVFFlat).

## Performance Considerations

- Cosine similarity on normalized vectors = dot product (fastest)
- Euclidean distance requires squared differences (slightly slower)
- ANN indexes abstract distance computation but affect recall
- Higher dimensions = more compute per distance computation

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not normalizing vectors | Assumption model does it | Incorrect similarity scores | Verify norm=1 post-embedding |
| Wrong distance metric for model | Default assumption | Suboptimal ranking | Use model's recommended metric |
| Mixing vector and keyword scores without normalization | Different scales | One dominates fusion | Use RRF for hybrid |

## Related Topics

- K041 (pgvector extension)
- K061 (RRF - Reciprocal Rank Fusion)

## AI Agent Notes

- Cosine similarity is the default metric for most embedding models
- Normalized vectors enable using dot product (fastest) interchangeably with cosine
- For agents: use cosine similarity as default, check model documentation

## Verification

- [ ] Understand vector distance metrics
- [ ] Embedding normalization verified
- [ ] Correct metric chosen for model
- [ ] Hybrid fusion uses RRF not raw scores
