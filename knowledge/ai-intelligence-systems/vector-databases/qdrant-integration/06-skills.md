# Skill: Integrate Qdrant Vector Database with Laravel
## Purpose
Deploy and configure Qdrant vector database (self-hosted or cloud) with PHP SDK integration for production vector search at scale.
## When To Use
- When scale exceeds pgvector's practical limits (>50M vectors)
- When PostgreSQL is not available in the stack
- When self-hosting a dedicated vector database is preferred
- When advanced payload filtering at scale is required
## When NOT To Use
- When PostgreSQL is available — default to pgvector (zero additional infrastructure)
- Prototypes where any vector store suffices
## Prerequisites
- Qdrant instance (Docker self-hosted or Qdrant Cloud)
- PHP SDK for Qdrant (`spirit13/qdrant-laravel` or `wontonee/laravel-qdrant-sdk`)
- Vector embedding model configured
## Inputs
- Qdrant connection configuration (host, port, API key)
- Collection schema (vector dimensions, distance metric)
- Vectors and payload metadata to index
- Search configuration (top-K, payload filters)
## Workflow (numbered)
1. Deploy Qdrant (Docker for self-hosted or sign up for Qdrant Cloud)
2. Install and configure PHP SDK for Qdrant
3. Create collection with vector configuration (dimensions, distance metric)
4. Upsert points in batches of 100-500 for efficient ingestion
5. Apply payload filters (tenant_id, category) during search
6. Implement search queries with vector similarity + payload filtering
7. Monitor collection size and query performance
8. Implement retry and reconnection for Qdrant client
## Validation Checklist
- [ ] Qdrant instance accessible from application
- [ ] Collection created with correct dimensions and distance metric
- [ ] Batch upsert implemented (100-500 points per request)
- [ ] Payload filtering applied on search queries
- [ ] Tenant isolation enforced via payload filters
- [ ] Retry/reconnect logic implemented for client
- [ ] Collection size and performance monitored
## Common Failures
- Upserting points one at a time — 100-500x slower
- Creating collection with wrong dimensions — vectors rejected
- Not implementing retry — Qdrant temporary unavailability breaks ingestion
- Forgetting payload filters — search returns unauthorized results
## Decision Points
- **Self-hosted vs Qdrant Cloud**: Self-hosted (Docker, free, Apache 2.0) for control; Qdrant Cloud (managed, $25+/month) for reduced ops
- **gRPC vs REST API**: gRPC for higher performance; REST for simpler implementation
## Performance Considerations
- Qdrant Rust-based: very fast query performance
- HNSW index similar to pgvector — tune ef_search, m, ef_construction
- Batch upsert 100-500 points per request for optimal throughput
- Horizontal scaling for >50M vectors
## Security Considerations
- Self-hosted Qdrant: configure API key and TLS
- Qdrant Cloud: verify data processing agreement and region
- Payload filtering for tenant isolation — enforce at query level
- Encrypt Qdrant client communication with TLS
## Related Rules (from 05-rules.md)
- Batch Upsert Points (100-500 per Request)
## Related Skills
- Select Vector Database Using Decision Framework
- Implement pgvector Vector Search in Laravel
- Implement Multi-Tenant Vector Isolation
## Success Criteria
- Qdrant vector search performs at sub-10ms for target dataset size
- Batch ingestion processes vectors efficiently
- Payload filtering enforces tenant isolation
- Client handles connection failures gracefully with retry
