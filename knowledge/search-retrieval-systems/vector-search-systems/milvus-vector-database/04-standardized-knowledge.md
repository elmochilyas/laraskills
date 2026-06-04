| Metadata | |
|---|---|
| KU ID | K059 |
| Subdomain | vector-similarity-search |
| Topic | Milvus (Open-Source Vector DB) |
| Source | Milvus Docs |
| Maturity | Stable |

## Overview

Milvus is an open-source, distributed vector database designed for large-scale similarity search. It supports multiple index types (IVF, HNSW, DiskANN, GPU indexes), hybrid search (BM25 + dense vectors), multi-vector search (ColBERT-style), and built-in scalar filtering. Milvus can be deployed standalone or as a distributed cluster. For Laravel, integration is via REST API or gRPC.

## Core Concepts

- **Distributed Architecture**: Separates storage, indexing, and query nodes for horizontal scaling.
- **Multiple Index Types**: IVF, HNSW, DiskANN (disk-based), GPU indexes.
- **Hybrid Search**: BM25 sparse + dense vector fusion.
- **Multi-Vector**: ColBERT-style late interaction for fine-grained relevance.
- **Scalar Filtering**: Metadata filtering combined with vector search.

## When To Use

- Large-scale vector search (>10M vectors) with distributed infrastructure
- Hybrid search (BM25 + dense) within a single database
- GPU-accelerated indexing and search
- Applications needing multiple index types for different workloads
- Enterprise deployments requiring high availability and scaling

## When NOT To Use

- Small to medium datasets (pgvector or single-node Qdrant may be simpler)
- PostgreSQL-based applications (adding another database increases complexity)
- Applications needing Scout-native integration (no Scout driver for Milvus)
- Teams without infrastructure expertise for distributed systems

## Best Practices

1. **Start standalone, scale to cluster**: Begin with standalone deployment for simplicity.
2. **Choose the right index**: IVF for balanced performance, HNSW for query speed, DiskANN for >RAM datasets.
3. **Configure consistency level**: Milvus offers strong, bounded staleness, session, and eventual consistency.
4. **Partition data by tenant**: Use partition key for multi-tenancy within a collection.
5. **Monitor index build**: Indexing consumes significant CPU and memory resources.

## Architecture Guidelines

- Deploy via Docker Compose for development, Helm chart for Kubernetes in production.
- Define collection schema with vector field, scalar fields, and index parameters.
- Use Milvus SDK or REST API from Laravel for data operations.
- Hybrid search: configure both BM25 and vector fields in the collection.

## Performance Considerations

- GPU indexes provide 10-100x faster indexing than CPU-only.
- DiskANN enables >RAM datasets using SSDs with minimal performance impact.
- Query latency: 5-50ms depending on index type, dataset size, and hardware.
- Write throughput scales horizontally with cluster size.

## Related Topics

- K060 (Milvus hybrid search)
- K042 (pgvector HNSW / IVFFlat indexing)
- K048 (Qdrant vector search)
- K056 (Pinecone managed vector database)

## AI Agent Notes

- Milvus is the most scalable open-source vector DB for large distributed deployments.
- GPU acceleration is a key differentiator for large-scale indexing.
- For agents: start standalone; use HNSW for query speed or DiskANN for >RAM datasets; prefer managed Milvus Cloud for production.

## Verification

- [ ] Milvus deployed (standalone or cluster)
- [ ] Collection created with correct schema
- [ ] Vectors indexable and searchable
- [ ] Distance metric matching embedding model
- [ ] Index type selected and built
- [ ] Backup/disaster recovery strategy in place
