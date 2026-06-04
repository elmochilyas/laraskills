# Knowledge Unit: Qdrant Vector Search

## Metadata

- **ID:** K048
- **Subdomain:** Vector Similarity Search
- **Source:** Qdrant Docs
- **Maturity:** Stable
- **Laravel Relevance:** High-performance vector DB

## Executive Summary

Qdrant is a high-performance vector database written in Rust, optimized for production similarity search. It supports dense and sparse vectors, payload filtering, quantization, and hybrid search natively. Qdrant can be self-hosted or used via Qdrant Cloud. For Laravel applications, it integrates via REST API or community PHP SDKs.

## Core Concepts

- **Vector Storage**: Stores vectors with optional payload (structured metadata).
- **ANN Index**: Uses HNSW by default, configurable per segment.
- **Payload Filtering**: SQL-like filter expressions on structured metadata alongside vector search.
- **Dense + Sparse**: Supports both dense embeddings and sparse vectors (for keyword-aware search).
- **Rust-Based**: Designed for high concurrency and low latency.

## Internal Mechanics

Qdrant organizes vectors into collections. Each collection can have multiple named vectors per point. Indexing uses HNSW with configurable parameters (m, ef_construct). Search operations accept both a query vector and payload filters. Qdrant applies the filter during the HNSW traversal (via iterative scan-like mechanisms). Results include both vector distances and payload data.

## Patterns

- **Single-node production**: Qdrant's single-node performance is excellent for most workloads.
- **Multi-node HA**: Qdrant's Raft-based clustering provides automatic failover.
- **Vector + metadata**: Always index relevant metadata as payload for filtering.
- **Quantized vectors**: Use scalar or product quantization for large-scale deployments.

## Architectural Decisions

Qdrant chose Rust for performance and memory safety. Its segment-based storage design allows efficient indexing and search. The payload filtering is integrated with vector search (not post-filter), ensuring filter-aware ANN.

## Tradeoffs

| Factor | Qdrant | pgvector |
|---|---|---|
| Separate infra | Yes (separate server) | No (in PostgreSQL) |
| Query latency | 1-5ms | 2-10ms |
| Scaling | Horizontal (Raft) | Vertical |
| Payload filtering | Rich expression language | SQL WHERE |
| PHP SDK | Community (REST/RPC) | Raw SQL |

## Performance Considerations

- Sub-10ms query latency for millions of vectors.
- HNSW with default parameters provides 95-99% recall.
- Memory-mapped storage allows datasets larger than RAM (at slower performance).
- Quantization reduces memory by 4-8x with minimal recall loss.

## Production Considerations

- **Configure HNSW parameters** (m, ef_construct, ef_search) for your dataset.
- **Use Qdrant Cloud** for managed infrastructure with HA.
- **Enable quantization** for large datasets to reduce memory requirements.
- **Monitor segment optimization** — Qdrant merges small segments during optimization.

## Common Mistakes

- Not configuring HNSW parameters — defaults are conservative.
- Storing large payloads with every vector — payload size impacts search performance.
- Not using quantization for datasets >1M vectors — memory usage grows linearly.
- Expecting Scout-like integration — Qdrant requires custom integration code.

## Failure Modes

- **OOM**: Dataset exceeds available memory if not using mmap or quantization.
- **Slow segment optimization**: Large numbers of unoptimized segments degrade query performance.
- **Replication lag**: In a cluster, index updates may lag behind the leader.

## Ecosystem Usage

Growing adoption in the Laravel ecosystem for production RAG pipelines and semantic search. Qdrant's PHP SDK (community) and REST API make integration straightforward.

## Related Knowledge Units

- K049 (Qdrant hybrid queries)
- K050 (Qdrant payload filtering)
- K051 (Qdrant quantization)
- K052 (Qdrant multitenancy)
- K053 (Qdrant FastEmbed)
- K054 (Qdrant cross-encoder re-ranking)
- K055 (Qdrant Edge)

## Research Notes

Source: Qdrant docs. Qdrant's focus is production-grade vector search with built-in tools (hybrid search, quantization, multi-tenancy) that other vector databases require custom solutions for. The REST API makes it accessible from any PHP application.


## Mental Models

- **Payload as Passport**: Qdrant treats vector search as identity verification and payload filtering as passport checks. A vector finds candidates, then payload filters validate their credentials.
- **Storage Engine**: Qdrant's HNSW index is like a skip list in high-dimensional space — you navigate through layers of increasing precision to find nearest neighbors.

