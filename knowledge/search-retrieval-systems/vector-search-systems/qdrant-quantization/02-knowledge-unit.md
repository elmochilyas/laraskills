# Knowledge Unit: Qdrant Quantization

## Metadata

- **ID:** K051
- **Subdomain:** Vector Similarity Search
- **Source:** Qdrant Docs
- **Maturity:** Stable
- **Laravel Relevance:** Memory reduction

## Executive Summary

Qdrant supports three quantization methods — scalar, product, and binary quantization — to reduce vector memory footprint. Scalar quantization (SQ) converts 32-bit floats to 8-bit integers, product quantization (PQ) compresses vector dimensions into codewords, and binary quantization (BQ) converts to sign bits. Quantization can reduce memory usage by 4-8x with configurable recall tradeoffs.

## Core Concepts

- **Scalar Quantization (SQ)**: Maps each float dimension to an 8-bit integer. 4x compression.
- **Product Quantization (PQ)**: Splits vectors into sub-vectors, each encoded as a codeword from a learned codebook. 8-16x compression.
- **Binary Quantization (BQ)**: Sign-bit representation. 32x compression.
- **Quantization on Disk (QoD)**: Stores quantized vectors in memory and full vectors on disk. Best of both worlds.

## Internal Mechanics

Qdrant applies quantization at the segment level during optimization. For SQ, min/max values per dimension are computed from the dataset, and each value is linearly scaled to 0-255. For PQ, k-means clustering learns a codebook of centroids per sub-space. For BQ, the sign of each dimension determines the bit value. At search time, approximate distances are computed on quantized data, and optional rescoring uses full-precision vectors.

## Patterns

- **SQ for general use**: 4x compression with minimal recall loss (<1%).
- **PQ for extreme compression**: 8-16x compression with 2-5% recall loss. Good for very large datasets.
- **BQ for ultra-fast search**: Hamming distance on binary vectors is extremely fast; use with rescoring.
- **QoD for memory-constrained**: Keep full vectors on disk, quantized in memory.

## Architectural Decisions

Qdrant provides multiple quantization options because memory is often the primary scaling constraint for vector databases. Quantization trades precision for memory, similar to image compression formats.

## Tradeoffs

| Method | Compression | Recall Loss | Best For |
|---|---|---|---|
| None | 1x | None | <1M vectors |
| Scalar (SQ) | 4x | <1% | General production |
| Product (PQ) | 8-16x | 2-5% | Very large datasets |
| Binary (BQ) | 32x | 5-10% | Ultra-high scale |
| QoD | Variable | Configurable | Memory-constrained |

## Performance Considerations

- SQ distances are computed on 8-bit values — faster than FP32 distance.
- PQ distances require lookup table construction — adds ~microseconds per query.
- BQ Hamming distance is extremely fast (bitwise operations).
- Rescoring full vectors adds ~1ms per 100 candidates.

## Production Considerations

- **Use QoD (Quantization on Disk)** for production: quantized vectors in RAM for speed, full vectors on disk for rescoring.
- **Test quantization recall** on your dataset before committing.
- **Configure rescoring** to mitigate recall loss from quantization.
- **Monitor memory savings** — quantization should reduce the working set to fit in available RAM.

## Common Mistakes

- Using PQ on low-dimensional vectors (<100 dims) — sub-vector splitting doesn't work well.
- Not using rescoring after quantization — recall loss is noticeable without it.
- Expecting 32x compression with binary quantization to maintain full recall.
- Applying quantization without verifying recall on your specific embedding model.

## Failure Modes

- **Recall collapse**: Some embedding models degrade significantly under aggressive quantization.
- **PQ codebook mismatch**: If data distribution shifts, the learned codebook becomes stale.
- **Rescoring bottleneck**: Rescoring too many candidates negates quantization's performance benefit.

## Ecosystem Usage

Standard in production Qdrant deployments with >1M vectors. QoD is the recommended approach for most use cases.

## Related Knowledge Units

- K048 (Qdrant vector search)
- K047 (pgvector binary quantization)

## Research Notes

Source: Qdrant docs. Quantization on Disk is a Qdrant-specific feature that provides a unique balance of memory efficiency and precision. Most teams start with SQ and upgrade to QoD when memory becomes constrained.


## Mental Models

- **Payload as Passport**: Qdrant treats vector search as identity verification and payload filtering as passport checks. A vector finds candidates, then payload filters validate their credentials.
- **Storage Engine**: Qdrant's HNSW index is like a skip list in high-dimensional space — you navigate through layers of increasing precision to find nearest neighbors.

