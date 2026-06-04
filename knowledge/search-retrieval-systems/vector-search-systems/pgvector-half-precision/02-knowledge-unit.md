# Knowledge Unit: pgvector Half-Precision / Binary / Sparse Vectors

## Metadata

- **ID:** K044
- **Subdomain:** Vector Similarity Search
- **Source:** pgvector Docs
- **Maturity:** Stable
- **Laravel Relevance:** Storage optimization

## Executive Summary

pgvector supports multiple vector types beyond standard 32-bit float: `halfvec` (16-bit half-precision), `bit` (binary), and `sparsevec` (sparse vectors). These types provide significant storage and performance improvements — `halfvec` halves storage with negligible recall loss, `bit` enables extremely fast Hamming distance search, and `sparsevec` efficiently stores high-dimensional sparse embeddings.

## Core Concepts

- **halfvec(v)**: 16-bit IEEE half-precision float. Each dimension uses 2 bytes instead of 4. Max 4000 dimensions (vs 2000 for `vector`).
- **bit(v)**: Binary vector. Each dimension is a single bit. Best used with `binary_quantize()` from a full vector.
- **sparsevec**: Sparse vector format. Only non-zero dimensions are stored. Efficient for BM25-derived or SPLADE embeddings.
- **Conversion Functions**: `halfvec(vector)`, `binary_quantize(vector) → bit`, `vector(sparsevec)`.

## Internal Mechanics

pgvector implements custom data type storage for each variant. `halfvec` stores as `float16` in PostgreSQL's heap. `bit` stores as a bitstring. `sparsevec` stores as a compressed list of (index, value) pairs. Each type has its own distance operators and index support. The `binary_quantize()` function computes the sign of each dimension: `1` if > 0, `0` if ≤ 0.

## Patterns

- **Use `halfvec` as default** for any embedding workload with dimensions > 2000 or when storage is a concern.
- **Use `bit` + Hamming distance** for ultra-fast approximate search, followed by re-ranking with full vectors.
- **Use `sparsevec`** for SPLADE, BM25-derived, or TF-IDF-based sparse embeddings.
- **Two-phase search**: ANN on `bit` with Hamming → re-rank top-K with full vector.

## Architectural Decisions

pgvector provides these optimized types because vector storage is often the most expensive resource in vector search systems. The quantization types trade precision for storage, similar to how JPEG trades image quality for file size.

## Tradeoffs

| Type | Bytes per dim | Max Dims | Recall vs vector | Use Case |
|---|---|---|---|---|
| `vector` | 4 | 2000 | Baseline | Maximum precision |
| `halfvec` | 2 | 4000 | ~99.5% | Storage-optimized |
| `bit` | 0.03125 (1/32) | N/A | ~90-95% | Two-phase search |
| `sparsevec` | Variable | N/A | N/A | Sparse embeddings |

## Performance Considerations

- `halfvec` halves I/O and memory bandwidth — 2x faster distance computation for the same dimension count.
- HNSW index on `halfvec(3072)` is ~8GB for 1M vectors; `vector(3072)` would be ~16GB.
- `bit` Hamming distance search is extremely fast (bitwise XOR + popcount) — 10-100x faster than float distance.
- `sparsevec` search requires inverted index-like lookups — can be slower than dense search for high-density vectors.

## Production Considerations

- **Default to `halfvec`** for text embeddings. Recall impact is negligible for most models.
- **Use `binary_quantize` re-ranking** for high-scale deployments where index fits in memory is critical.
- **Test recall on your specific dataset** — some embedding models are more quantization-sensitive than others.
- **Monitor index size** — `halfvec` vs `vector` can be the difference between fitting in `shared_buffers` or not.

## Common Mistakes

- Using `vector` when `halfvec` provides near-identical recall — unnecessary 2x storage cost.
- Expecting `bit` recall to match `vector` — binary quantization loses significant precision.
- Applying `binary_quantize` without a re-ranking plan — results are too imprecise for final use.
- Using `sparsevec` for dense embeddings (most non-zero values) — defeats the compression purpose.

## Failure Modes

- **Dimension overflow for HNSW**: `vector` > 2000 dims cannot use HNSW. `halfvec` can handle up to 4000.
- **Precision loss**: `halfvec` may cause recall regression for models sensitive to quantization (rare, but test).
- **`bit` type mismatch**: Query must also be binary-quantized. Using raw vector with bit type errors.

## Ecosystem Usage

Standard practice in production pgvector deployments. `halfvec` is the recommended default for new implementations. Binary quantization is used where index size is a hard constraint.

## Related Knowledge Units

- K041 (pgvector extension)
- K047 (pgvector binary quantization + re-ranking)

## Research Notes

Source: pgvector docs, community benchmarks (Instaclustr). The recall gap between `vector` and `halfvec` is typically <0.5% for 1536-dim embeddings. Binary quantization recall varies from 90-97% depending on the embedding model and dataset.


## Mental Models

- **Extension as Plugin**: pgvector is like a plugin module for PostgreSQL that adds a new data type (vectors) and new index types (IVFFlat, HNSW). It is SQL-native.
- **Dual Engine**: A pgvector hybrid search combines a diesel engine (FTS) with an electric motor (vector search) in the same car. RRF is the transmission that combines their output.

