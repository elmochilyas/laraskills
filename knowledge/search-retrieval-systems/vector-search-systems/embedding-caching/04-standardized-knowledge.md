| Metadata | |
|---|---|
| KU ID | ku-09 |
| Subdomain | vector-similarity-search |
| Topic | Embedding Caching |
| Source | Industry |
| Maturity | Stable |

## Overview

Embedding caching stores generated embeddings to avoid redundant API calls or computation. Cache key is typically a hash of the input text + model + dimensionality. Cache storage options: in-memory (Redis), database, or filesystem. Caching is critical for cost optimization at scale.

## Core Concepts

- **Cache Key**: MD5/SHA256(text + model + dimensions) → unique embedding
- **Cache Store**: Redis (fastest), database (persistent), filesystem (simple)
- **Cache Invalidation**: When model changes, dimensionality changes, or text is updated
- **Write-Through**: Embed on first request, cache for subsequent
- **Warm-Up**: Pre-compute embeddings for known content on deploy
- **TTL**: Optional time-based cache expiry for frequently changing content

## When To Use

- All embedding generation (never re-embed the same text)
- API-based embeddings (cost optimization)
- Large document collections with repeated queries
- Production RAG pipelines

## When NOT To Use

- Trivial applications with negligible embedding volume
- One-time embedding jobs (no repeated content)

## Best Practices

1. **Always cache embeddings**: Embedding generation is expensive — cache everything.
2. **Include model + dimensions in cache key**: Different models produce different vectors.
3. **Use Redis for query-time cache**: Fastest read/write.
4. **Use database for persistent cache**: Survives cache flush.
5. **Invalidate on content change**: Re-embed when source text changes.
6. **Pre-warm on deploy**: Avoid cold start for known content.

## Related Topics

- K067 (Embedding generation)
- K007 (Local embeddings)
- K008 (API embeddings)

## AI Agent Notes

- Embedding caching is the easiest cost optimization for vector search
- Cache key must include model and dimensionality — not just text
- For agents: implement caching before scaling any embedding pipeline

## Verification

- [ ] Cache key includes text + model + dimensions
- [ ] Cache store configured (Redis/database)
- [ ] Cache hit/miss rate monitored
- [ ] Cache invalidation on content change
- [ ] Pre-warming for known content
- [ ] Cache TTL configured appropriately
