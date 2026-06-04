# Knowledge Unit: pgvector Binary Quantization + Re-Ranking

## Metadata

- **ID:** K047
- **Subdomain:** Vector Similarity Search
- **Source:** pgvector Docs
- **Maturity:** Stable
- **Laravel Relevance:** Scale optimization

## Executive Summary

pgvector's binary quantization converts full-precision vectors to binary (sign-bit) representations, enabling extremely fast Hamming distance search. The two-phase approach — binary ANN search followed by full-precision re-ranking of top candidates — achieves 10-150x build time speedups and ~30x QPS improvements over IVFFlat, with only marginal recall loss.

## Core Concepts

- **Binary Quantization**: `binary_quantize(vector)` produces a `bit` vector where each dimension is 1 (positive) or 0 (negative/no).
- **Two-Phase Search**: 1) ANN search on `bit` vectors using Hamming distance. 2) Re-rank top-K candidates using full-precision distance.
- **Build Speed**: Binary indexes build ~150x faster than HNSW (pgvector 0.7.0 benchmarks).
- **Storage**: `bit` vectors use 1/32 the storage of full vectors.

## Internal Mechanics

The `binary_quantize()` function computes the sign of each vector dimension. The resulting bit vector is stored in a `bit` column and indexed with HNSW. At query time, the query vector is also binary-quantized. HNSW+Hamming search returns top-N candidates. These candidates are then re-ranked using full-precision distance (cosine, L2) by fetching the original vectors from the table.

## Patterns

- **High-throughput search**: When QPS targets exceed what full-precision ANN can deliver.
- **Large-scale indexing**: When build time is a bottleneck (>10M vectors).
- **Storage-constrained**: When the HNSW index doesn't fit in `shared_buffers`.
- **First-pass filtering**: Use binary search as a pre-filter before more expensive full-precision scoring.

## Architectural Decisions

Binary quantization exploits the observation that the sign of a vector dimension carries significant semantic information. For many embedding models (especially OpenAI's), sign bits preserve 90-97% of the ranking quality while enabling 32x compression.

## Tradeoffs

- Recall: 90-97% of full-precision recall, depending on the embedding model.
- No free lunch: Binary quantization fails for low-dimensional vectors (<100 dims) where sign information is less informative.
- Re-ranking overhead: Must fetch full vectors from the heap for re-ranking.

## Performance Considerations

- Build time: 150x faster than full HNSW for 1M vectors at 99% recall target.
- Query time: Hamming distance is essentially free (bitwise XOR + popcount).
- Re-ranking adds: ~1-5ms for top-10 candidates (full-precision distance computation).
- Storage: ~3GB for 1M 1536-dim vectors (binary) vs ~8GB (halfvec HNSW).

## Production Considerations

- **Use for high-scale deployments** where index build time or memory is a constraint.
- **Test recall on your specific model** — some embedding models are more quantization-friendly.
- **Re-rank with the original precision** — never serve binary search results directly.
- **Monitor the re-ranking overhead** — it's usually acceptable (<5ms) for small candidate pools.

## Common Mistakes

- Serving binary search results directly without re-ranking — poor recall for end users.
- Using binary quantization on low-dimensional vectors (<100 dims) — sign information is insufficient.
- Not testing recall against a baseline — quantization may perform worse than expected for some models.
- Re-ranking too many candidates (top-1000) — defeats the performance benefit.

## Failure Modes

- **Unacceptable recall loss**: Some embedding models produce clusters where sign boundaries are not informative.
- **Re-ranking bottleneck**: If the re-ranking candidate pool is too large, latency increases.
- **Type mismatch**: Forgetting to binary_quantize the query vector before searching.

## Ecosystem Usage

Used in high-scale production pgvector deployments where every millisecond of query time and every GB of storage counts. The binary quantization path was a key pgvector 0.7.0 feature.

## Related Knowledge Units

- K041 (pgvector extension)
- K044 (pgvector half-precision / binary)

## Research Notes

Source: pgvector docs, Instaclustr benchmarks (2026). Binary quantization with re-ranking provides the best performance-to-recall ratio for large-scale pgvector deployments. The technique is analogous to other vector database quantization approaches (scalar quantization, product quantization).


## Mental Models

- **Extension as Plugin**: pgvector is like a plugin module for PostgreSQL that adds a new data type (vectors) and new index types (IVFFlat, HNSW). It is SQL-native.
- **Dual Engine**: A pgvector hybrid search combines a diesel engine (FTS) with an electric motor (vector search) in the same car. RRF is the transmission that combines their output.

