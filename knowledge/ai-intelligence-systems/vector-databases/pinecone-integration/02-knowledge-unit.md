# Knowledge Unit: Pinecone Integration

## Metadata

- **ID:** KU-031
- **Subdomain:** Vector Database Integration
- **Slug:** pinecone-integration
- **Version:** 1.0.0
- **Maturity:** Stable (SaaS)
- **Status:** Published

## Executive Summary

Pinecone is a fully managed vector database SaaS. It requires zero operational overhead — no servers, no index tuning, no scaling decisions. In the Laravel ecosystem, Pinecone integration is via HTTP API (no dedicated first-party PHP SDK). It's justified when teams lack PostgreSQL infrastructure, need unlimited scale, or require serverless vector search.

## Core Concepts

- **Indexes**: Pinecone's vector storage unit with configurable dimensions, metric, and capacity
- **Namespaces**: Logical partitions within an index for multi-tenancy
- **Serverless**: Automatic scaling — no capacity planning needed
- **Pods (legacy)**: Provisioned capacity for predictable workloads
- **Metadata filtering**: Filter vectors by key-value pairs at query time
- **Upsert**: Insert or update vectors in batches
- **Query**: Search by vector with optional metadata filter, top-K

## Mental Models

- **DynamoDB for vectors**: Fully managed, serverless, pay-per-operation. No infrastructure management. High per-operation cost but zero DevOps.
- **AI vector hosting**: Like hosting your embeddings on AWS S3 — it's someone else's computer, fully managed, scales infinitely, costs proportionally to usage.

## Internal Mechanics

Pinecone stores vectors in serverless indexes that auto-scale based on usage. The HNSW index is managed internally — no tuning parameters exposed. The query API accepts a vector, optional metadata filter, and top-K count, returning matching vectors with scores.

PHP integration: raw HTTP requests to Pinecone REST API (no official PHP SDK). Custom wrapper classes or `Http::withToken($apiKey)->post(PINECONE_URL/query, $payload)`.

## Patterns

- **Namespace isolation**: Use Pinecone namespaces per tenant — no separate indexes needed
- **Metadata for access control**: Store tenant_id as metadata field, filter at query time
- **Batch upserting**: Upsert up to 100 vectors per request for optimal throughput
- **Index tagging**: Tag indexes with environment (dev/staging/prod) — Pinecone doesn't isolate environments
- **Custom PHP wrapper**: Build a PineconeService class wrapping HTTP calls for testability

## Architectural Decisions

- **Decision**: Pinecone vs. pgvector → Pinecone when: no existing PostgreSQL, scale >50M vectors, serverless preference, or team lacks PostgreSQL DBA expertise. pgvector for all other cases.
- **Decision**: Serverless vs. pod-based → Serverless for variable workloads (auto-scale, pay per usage). Pods for predictable, high-throughput workloads with cost optimization.

## Tradeoffs

| Factor | Pinecone | pgvector | Qdrant |
|--------|----------|----------|--------|
| Management | Fully managed | Self-managed | Self-hosted or managed |
| Scale | Unlimited | ~50M vectors | 100M+ vectors |
| Cost | $70+/month (serverless) | Free (existing DB) | Free (self-hosted) |
| Latency | ~8ms p50 | ~8ms p50 | ~6ms p50 |
| Data control | Third-party | Your infrastructure | Your infrastructure |
| Vendor lock-in | High (proprietary) | None (open source) | Low (Apache 2.0) |

## Performance Considerations

- Serverless Pinecone: cold start latency for infrequent queries (500ms-2s first query)
- Pod-based: consistent ~8ms p50 for 1M vectors
- Metadata filtering adds slight latency — proportional to filter selectivity
- Batch upserts: 100 vectors/batch is optimal — more causes HTTP timeouts
- Query concurrency: serverless scales automatically; pods have limited concurrent queries

## Production Considerations

- Create separate indexes per environment (dev/staging/prod)
- Implement API key rotation — Pinecone keys are long-lived
- Monitor index size and query volume — unexpected spikes = cost surprises
- Pin Pinecone API version in your HTTP client
- Handle Pinecone API 503s gracefully — implement retry with backoff
- Export index statistics for cost allocation and capacity planning
- Plan for index rebuild if dimension or metric changes are needed

## Common Mistakes

- Using Pinecone when pgvector on existing PostgreSQL would work (unnecessary cost and complexity)
- Not implementing HTTP retry logic — Pinecone API can return transient errors
- Upserting vectors one at a time instead of batch — 100x slower
- Forgetting to set metadata filters for multi-tenant access — cross-tenant data leakage
- No fallback for Pinecone outage — application becomes completely unavailable
- Not monitoring costs — serverless pricing can surprise with high query volumes

## Failure Modes

- **Pinecone outage**: All vector search features down — no self-hosted fallback option
- **Rate limiting**: High query volume triggers 429 — implement queuing or request coalescing
- **Index quota exceeded**: Free tier has limited indexes — plan for paid tier in production
- **API version deprecation**: Pinecone API changes break integration — monitor changelog
- **Data egress costs**: Querying large volumes across regions — co-locate Pinecone with application

## Ecosystem Usage

- No official PHP/Pinecone SDK — custom HTTP wrapper required
- `moneo/laravel-rag` has community-contributed Pinecone driver (experimental)
- Most common in serverless Laravel deployments (Vapor) where PostgreSQL isn't available
- Also used in early-stage startups without dedicated infrastructure team
- Data residency requirements may conflict with Pinecone's cloud regions

## Related Knowledge Units

- KU-028: pgvector Native Support
- KU-030: Qdrant Integration
- KU-035: Vector Database Selection Framework
- KU-033: Multi-Tenant Vector Isolation

## Research Notes

- Pinecone has no official PHP SDK — all integration is via HTTP REST API
- Self-hosted alternatives (pgvector, Qdrant) offer better cost profiles for most Laravel workloads
- Pinecone's "serverless" tier auto-scales to zero — good for dev/staging but has cold start penalty
- Pinecone's data residency options are limited compared to self-hosted solutions
- Cost analysis: Pinecone is typically 5-10x more expensive than pgvector at equivalent scale
