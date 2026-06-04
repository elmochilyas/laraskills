| Metadata | |
|---|---|
| KU ID | K048 |
| Subdomain | vector-similarity-search |
| Topic | Qdrant Vector Search |
| Source | Qdrant Docs |
| Maturity | Stable |

## Overview

Qdrant is a high-performance vector database written in Rust, optimized for production similarity search. It supports dense and sparse vectors, payload filtering, quantization, and hybrid search natively. Qdrant can be self-hosted or used via Qdrant Cloud. For Laravel applications, it integrates via REST API or community PHP SDKs.

## Core Concepts

- **Vector Storage**: Stores vectors with optional payload (structured metadata).
- **ANN Index**: Uses HNSW by default, configurable per segment.
- **Payload Filtering**: SQL-like filter expressions on structured metadata alongside vector search.
- **Dense + Sparse**: Supports both dense embeddings and sparse vectors (for keyword-aware search).
- **Rust-Based**: Designed for high concurrency and low latency.

## When To Use

- Production vector search needing high performance and low latency
- Hybrid search (dense + sparse vectors) without external systems
- Applications needing rich payload filtering alongside vector search
- Self-hosted or cloud-managed vector search

## When NOT To Use

- Small datasets where pgvector (in PostgreSQL) is simpler
- Applications already on PostgreSQL that benefit from vector-data co-location
- When Scout-native vector integration is required (use community package or REST API)
- Teams without resources to operate a separate vector database

## Best Practices

1. **Configure HNSW parameters** (m, ef_construct, ef_search) for your dataset size and recall requirements.
2. **Use payload filtering** for metadata filtering (more efficient than post-filter).
3. **Enable quantization** for large datasets to reduce memory 4-8x.
4. **Use Qdrant Cloud** for managed infrastructure with HA.
5. **Monitor segment optimization** — Qdrant merges segments during optimization.

## Architecture Guidelines

- Qdrant runs as a separate service — Docker for dev, dedicated server or cloud for prod.
- Integrate via REST API or community `qdrant-php` SDK.
- Create collections with appropriate vector size and distance metric.
- Use payload for metadata that needs filtering (not for large text content).

## Performance Considerations

- Sub-10ms query latency for millions of vectors.
- HNSW with default parameters provides 95-99% recall.
- Memory-mapped storage allows datasets larger than RAM (with performance tradeoff).
- Quantization reduces memory by 4-8x with minimal recall loss.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not configuring HNSW params | Defaults are conservative | Suboptimal query performance | Tune for dataset |
| Storing large payloads with vectors | Convenience | Slower search performance | Keep payload lean |
| No quantization for >1M vectors | Memory planning oversight | OOM on large datasets | Enable quantization |
| Expecting Scout-like integration | Assumption | Manual integration needed | Use REST API |

## Related Topics

- K049 (Qdrant hybrid queries)
- K050 (Qdrant payload filtering)
- K051 (Qdrant quantization)
- K052 (Qdrant multitenancy)
- K053 (Qdrant FastEmbed)
- K054 (Qdrant cross-encoder re-ranking)
- K055 (Qdrant Edge)

## AI Agent Notes

- Qdrant is the most feature-rich open-source vector database for Laravel.
- Integrates via REST API — no native Scout driver, but custom engine is feasible.
- For agents: start with single-node Qdrant; use quantization for datasets >1M; prefer cloud for production.

## Verification

- [ ] Qdrant server running (Docker/cloud)
- [ ] Collections created with correct vector size and metric
- [ ] Vector search returns semantically relevant results
- [ ] Payload filtering works alongside vector search
- [ ] HNSW parameters tuned for dataset
- [ ] Quantization enabled for large datasets
