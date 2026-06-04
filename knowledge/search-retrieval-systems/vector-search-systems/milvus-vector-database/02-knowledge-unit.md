# Knowledge Unit: Milvus Vector Database

## Metadata

- **ID:** K059
- **Subdomain:** Vector Similarity Search
- **Source:** Milvus Docs
- **Maturity:** Stable
- **Laravel Relevance:** Distributed vector search

## Executive Summary

Milvus is an open-source vector database designed for billion-scale vector similarity search. It features distributed architecture, GPU acceleration, built-in hybrid search (dense + BM25), and multiple index types (IVF_FLAT, HNSW, DiskANN). Milvus is designed for horizontal scaling from the ground up, making it suitable for very large vector workloads.

## Core Concepts

- **Distributed by Default**: Query nodes, index nodes, data nodes, and coordinators can scale independently.
- **GPU Acceleration**: Supports GPU-based indexing and search for NVIDIA GPUs.
- **Built-in BM25**: Can compute BM25 scores server-side for hybrid search without external sparse vectors.
- **Multiple Index Types**: IVF_FLAT, IVF_SQ8, HNSW, DiskANN, and GPU-index variants.
- **Collection/Partition/Segment Hierarchy**: Organizes vectors in a three-level hierarchy for efficient storage and search.

## Internal Mechanics

Milvus receives data into a log broker (Pulsar/kafka-like), processes it through data nodes, and builds indexes on index nodes. Queries are distributed across query nodes, which hold vector indexes in memory or on disk. The query coordinator merges results from multiple query nodes. This distributed architecture allows Milvus to handle billions of vectors.

## Patterns

- **Billion-scale search**: Milvus's primary use case. Handles datasets that don't fit on a single node.
- **Hybrid search pipeline**: Combine dense vectors with built-in BM25 for keyword-aware semantic search.
- **GPU-accelerated indexing**: Use GPU nodes for faster index building on large datasets.
- **Time-travel search**: Milvus supports querying data at specific points in time.

## Architectural Decisions

Milvus chose a cloud-native, distributed architecture (separation of storage and compute) to differentiate from single-node vector databases. This enables extreme scale at the cost of operational complexity.

## Tradeoffs

| Factor | Milvus | Qdrant | pgvector |
|---|---|---|---|
| Scale | Billion+ vectors | Million+ vectors | <10M vectors |
| Architecture | Distributed (complex) | Single-node + Raft | Single-node |
| GPU support | Yes | No | No |
| Operations | Complex (K8s recommended) | Simple (single binary) | None (in PostgreSQL) |
| PHP SDK | REST/gRPC (no official PHP) | Community PHP SDK | Raw SQL |
| Latency | 5-20ms | 1-5ms | 2-10ms |

## Performance Considerations

- Index build time is significant for billion-scale datasets — GPU acceleration helps.
- Query latency varies from 5-20ms depending on index type and cluster configuration.
- DiskANN index enables efficient search on SSD storage for indexes that don't fit in RAM.
- Memory-mapped storage for index files reduces RAM requirements.

## Production Considerations

- **Deploy on Kubernetes** — Milvus Operator simplifies cluster management.
- **Use Milvus Cloud** for managed infrastructure.
- **Choose the right index type**: HNSW for speed, IVF_FLAT for smaller memory, DiskANN for very large datasets.
- **Monitor query node memory** — indexes must fit in query node memory for optimal performance.
- **Plan for index building time** — large collections may take hours to index.

## Common Mistakes

- Deploying Milvus without Kubernetes — manual management of distributed components is error-prone.
- Not choosing the right index type for the workload characteristics.
- Expecting Laravel integration maturity — PHP SDK support is limited.
- Under-provisioning query node resources — causing high latency under load.

## Failure Modes

- **Query node OOM**: Index exceeds query node memory. Use DiskANN or more nodes.
- **Index build failure**: Insufficient resources for index building. Use GPU or more index nodes.
- **Coordinator failure**: The system becomes unavailable if the root coordinator fails (mitigated by HA).
- **PHP client immaturity**: Fewer community examples and less testing than Meilisearch/Typesense.

## Ecosystem Usage

Selected for very large-scale vector search (>10M vectors) where single-node solutions cannot handle the data volume. Less common in Laravel due to operational complexity and PHP SDK limitations.

## Related Knowledge Units

- K060 (Milvus hybrid search)
- K056 (Pinecone vector database)

## Research Notes

Source: Milvus docs. Milvus 2.4+ introduced built-in BM25 for hybrid search, eliminating the need for external sparse vector generation. Milvus is the most scalable open-source vector database but also the most complex to operate. PHP integration is via REST API.


## Mental Models

- **Vector Warehouse**: Milvus is a warehouse specialized for vectors — it does not store your source documents, just their vector representations and metadata.

