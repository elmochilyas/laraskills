# Skill: Integrate Pinecone Vector Database with Laravel
## Purpose
Configure and use Pinecone serverless vector database via HTTP API for managed vector search at unlimited scale.
## When To Use
- When serverless managed vector database is required
- When PostgreSQL is not available
- When scale exceeds self-hosted options
- When zero operational overhead is the priority
## When NOT To Use
- When PostgreSQL with pgvector is available (pgvector preferred)
- For cost-sensitive applications (Pinecone $70+/month)
- Prototypes where simpler options suffice
## Prerequisites
- Pinecone account and API key
- Pinecone index created with correct dimensions and metric
- Understanding of Pinecone's HTTP API
- Retry logic for HTTP calls
## Inputs
- Pinecone API key and environment
- Index name and dimension configuration
- Vectors with metadata to upsert
- Search query configuration
## Workflow (numbered)
1. Create Pinecone index with correct dimensions and metric
2. Implement HTTP retry logic with exponential backoff for all Pinecone calls
3. Batch upsert vectors (100-500 per batch) for efficient ingestion
4. Use namespaces for multi-tenant isolation
5. Apply metadata filters at query time for result refinement
6. Implement serverless index warm-up for consistent latency
7. Monitor Pinecone usage and costs
## Validation Checklist
- [ ] Pinecone index created with correct dimensions and distance metric
- [ ] HTTP retry logic with exponential backoff implemented
- [ ] Batch upsert implemented (100-500 per request)
- [ ] Namespace-based tenant isolation configured
- [ ] Metadata filtering applied on queries
- [ ] Error handling for Pinecone transient failures
- [ ] Usage and costs monitored
## Common Failures
- No HTTP retry — transient failures break search
- Upserting one vector at a time — extremely slow
- Not using namespaces — no multi-tenant isolation
- Creating index with wrong dimensions — vectors rejected
## Decision Points
- **Serverless vs pod-based**: Serverless for auto-scaling, variable workloads; pod-based for predictable capacity
- **Namespace vs metadata filtering for multi-tenancy**: Namespaces for strict isolation; metadata filtering for flexible filtering
## Performance Considerations
- Serverless cold start: 1-5 seconds after idle period — implement warm-up
- Query latency: 10-50ms typical with warm index
- Upsert throughput: batch size dependent (100-500 optimal)
- Cost: per-vector-hour + query units
## Security Considerations
- API key authentication — store securely in environment config
- TLS for all Pinecone API communication
- Namespace isolation for multi-tenancy — verify no cross-namespace leakage
- Metadata filtering must enforce access control at query time
## Related Rules (from 05-rules.md)
- Implement HTTP Retry Logic for Pinecone Calls
## Related Skills
- Select Vector Database Using Decision Framework
- Implement Multi-Tenant Vector Isolation
- Implement pgvector Vector Search in Laravel
## Success Criteria
- Pinecone query returns results at consistent <50ms latency
- Batch ingestion processes vectors efficiently
- Namespace isolation prevents cross-tenant data leakage
- Retry logic handles transient Pinecone failures gracefully
