| Metadata | |
|---|---|
| KU ID | K056 |
| Subdomain | vector-similarity-search |
| Topic | Pinecone Managed Vector Database |
| Source | Pinecone Docs |
| Maturity | Stable |

## Overview

Pinecone is a fully managed vector database service offering serverless and pod-based indexes. It provides high-performance vector search without infrastructure management. Pinecone supports approximate nearest neighbor (ANN) search with metadata filtering, namespaces for multi-tenancy, and integration with popular embedding models. For Laravel, integration is via REST or gRPC API.

## Core Concepts

- **Serverless Indexes**: Pay-per-query, auto-scaling, no capacity planning.
- **Pod-Based Indexes**: Provisioned capacity (pods) for predictable workloads.
- **Metadata Filtering**: Filter vectors by metadata fields (numeric, boolean, string).
- **Namespaces**: Logical partitions within an index for multi-tenancy.
- **gRPC/REST API**: Integration via HTTP/gRPC from any PHP application.

## When To Use

- Zero-infrastructure vector search (fully managed, no ops burden)
- Applications needing auto-scaling serverless vector search
- Production deployments where reliability and uptime are critical
- Teams that want to focus on application logic, not vector DB operations

## When NOT To Use

- Cost-sensitive high-volume applications (Pinecone pricing can be expensive at scale)
- Self-hosted requirements (data sovereignty, air-gapped environments)
- Applications needing hybrid search (keyword + vector) natively (use Qdrant/Typesense)
- Very large datasets (>100M vectors) where cost becomes prohibitive

## Best Practices

1. **Start with serverless**: Auto-scaling and pay-per-query is ideal for variable workloads.
2. **Use metadata filtering**: Include metadata fields for post-query filtering efficiency.
3. **Implement namespaces**: Use for multi-tenancy and environment isolation.
4. **Monitor usage costs**: Serverless pricing scales with query volume — set budgets.
5. **Cache query results**: Reduce costs and improve latency for frequent queries.

## Architecture Guidelines

- Integrate from Laravel via REST API or gRPC client.
- Choose index metric (cosine, dot product, Euclidean) matching your embedding model.
- Configure index dimension matching your embedding model output.
- Use serverless for variable workloads, pod-based for predictable high volume.

## Performance Considerations

- Sub-10ms query latency for serverless indexes.
- Serverless indexes scale automatically with query volume.
- Pod-based indexes provide consistent latency for provisioned capacity.
- Write operations are eventually consistent (<1 second typically).

## Related Topics

- K057 (Pinecone namespaces)
- K058 (Pinecone metadata filtering)
- K048 (Qdrant vector search)
- K067 (Embedding generation strategies)

## AI Agent Notes

- Pinecone is the easiest vector DB to operate — fully managed, no infrastructure.
- Serverless is ideal for getting started; pod-based for predictable high-volume workloads.
- For agents: use serverless for variable workloads; implement metadata filtering; use namespaces for multi-tenancy; monitor costs.

## Verification

- [ ] Pinecone account and index created
- [ ] Index dimension and metric match embedding model
- [ ] Vectors upsertable and searchable
- [ ] Metadata filtering configured and tested
- [ ] Namespace strategy implemented (if multi-tenant)
- [ ] Cost monitoring set up
