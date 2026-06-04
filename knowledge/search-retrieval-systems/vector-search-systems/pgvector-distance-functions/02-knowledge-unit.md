# Knowledge Unit: pgvector Distance Functions

## Metadata

- **ID:** K043
- **Subdomain:** Vector Similarity Search
- **Source:** pgvector Docs
- **Maturity:** Stable
- **Laravel Relevance:** Multiple distance metrics

## Executive Summary

pgvector supports multiple distance functions for vector similarity: cosine distance (`<=>`), L2/Euclidean distance (`<->`), and inner product (`<#>`). The choice of distance function must match the embedding model's training objective. pgvector 0.7.0+ also supports L1 distance, Hamming distance (for binary vectors), and Jaccard distance (for sparse vectors).

## Core Concepts

- **Cosine Distance** (`<=>`): `1 - cosine_similarity`. Most common for text embeddings (OpenAI, Cohere). Normalized vectors are required for cosine distance.
- **L2/Euclidean Distance** (`<->`): Straight-line distance. Common for image embeddings and when magnitude matters.
- **Inner Product** (`<#>`): `-dot_product`. Used when similarity is defined by dot product magnitude.
- **L1 Distance**: Sum of absolute differences. Robust to outliers.
- **Hamming Distance**: For `bit` type vectors. Number of differing bits.
- **Jaccard Distance**: For `sparsevec` type. `1 - intersection/union`.

## Internal Mechanics

Each distance function is implemented as a PostgreSQL operator. The operator uses the corresponding index access method when an ANN index is available. pgvector uses SIMD instructions (AVX-512, NEON) to accelerate distance computations. `cosine_distance` on normalized vectors is equivalent to `1 - inner_product`, but pgvector optimizes the implementation.

## Patterns

- **Use cosine distance for text**: OpenAI/Cohere embeddings are trained with cosine similarity.
- **Use L2 for images**: Image embedding models (CLIP, ResNet) often use L2.
- **Normalize vectors for cosine**: If your model doesn't produce normalized vectors, normalize them before storage.
- **Binary quantization uses Hamming**: For `bit` vectors created via `binary_quantize()`, use Hamming distance.

## Architectural Decisions

pgvector implements all common distance metrics because different embedding models use different similarity functions. The operator-based API maps cleanly to SQL's `ORDER BY` semantics.

## Tradeoffs

- Cosine distance requires normalized vectors for proper results (though unnormalized still works, just differently).
- L2 distance is faster to compute than cosine on some hardware (SIMD optimizations differ).
- Inner product is useful for model-specific similarity but less intuitive than cosine for most use cases.
- Hamming distance for binary vectors is extremely fast (bitwise operations).

## Performance Considerations

- L2 distance is slightly faster than cosine on most hardware (fewer floating-point operations).
- All distance functions benefit from SIMD acceleration in pgvector 0.7.0+.
- Distance computation for halfvec (16-bit) is faster than full vector (32-bit) due to reduced memory bandwidth.
- Binary quantization with Hamming distance offers the fastest search at the cost of recall.

## Production Considerations

- **Check your embedding model's documentation** for the expected distance function.
- **Normalize vectors** if using cosine distance unless the model already produces unit vectors.
- **Use `halfvec`** with cosine distance for 50% storage savings — recall impact is negligible for typical text embeddings.
- **Test with your specific model** — distance function choice affects recall more than index type for some models.

## Common Mistakes

- Using cosine distance for text embeddings without normalization (OpenAI embeddings are normalized by default, but others may not be).
- Using L2 distance for models trained with cosine similarity — significantly worse recall.
- Expecting Hamming distance on full-precision vectors to work well (use `binary_quantize()` first).
- Not verifying that the distance function matches the embedding model's training objective.

## Failure Modes

- **Wrong distance function**: Search results are semantically meaningless because similarity doesn't match the model's training.
- **Dimension mismatch**: Query vector must have the same dimensions as stored vectors.
- **Type mismatch**: Using cosine distance operator on `bit` type causes an error.

## Ecosystem Usage

Fundamental knowledge for any pgvector implementation. The distance function choice is one of the first decisions in building a vector search system.

## Related Knowledge Units

- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat)
- K044 (pgvector half-precision)
- K047 (pgvector binary quantization)

## Research Notes

Sources: pgvector docs, OpenAI embeddings docs, Cohere embeddings docs. OpenAI's `text-embedding-3-*` models produce normalized vectors. Cohere's models do not — they must be normalized before using cosine distance. Always check the model's documentation before choosing a distance function.


## Mental Models

- **Extension as Plugin**: pgvector is like a plugin module for PostgreSQL that adds a new data type (vectors) and new index types (IVFFlat, HNSW). It is SQL-native.
- **Dual Engine**: A pgvector hybrid search combines a diesel engine (FTS) with an electric motor (vector search) in the same car. RRF is the transmission that combines their output.

