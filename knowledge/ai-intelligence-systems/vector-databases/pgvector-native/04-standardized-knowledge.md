---
id: KU-028
title: "pgvector Native Support"
subdomain: "vector-database-integration"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/05-vector-databases/pgvector-native/04-standardized-knowledge.md"
---

# pgvector Native Support

## Overview

pgvector is the default production vector database for Laravel RAG. Laravel 13 provides native support: `vector()` column type in migrations, `whereVectorSimilarTo()` query scope, and `Str::toEmbeddings()` embedding generation. pgvector runs on existing PostgreSQL infrastructure, supports ACID transactions, enables hybrid search (vector + full-text tsvector) in a single query, and requires zero additional services.

## Core Concepts

- `$table->vector('embedding', 1536)`: Migration column type for vector data (dimensions parameter)
- `whereVectorSimilarTo('column', $embedding, 'cosine')`: Eloquent scope for similarity search
- Distance operators: `<=>` (cosine), `<->` (L2/Euclidean), `<#>` (inner product)
- HNSW index: `USING hnsw (embedding vector_cosine_ops)` â€” sub-10ms search at 1M+ vectors
- IVFFlat index: Faster to build, slower to query â€” alternative to HNSW
- Hybrid search: Vector similarity + tsvector full-text in single SQL query

## When To Use

- Production applications requiring pgvector Native Support functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Inline vector column**: Vector stored alongside document data in same table â€” no separate vector store
- **Scoped vector search**: `where('tenant_id', $id)->whereVectorSimilarTo(...)` â€” tenant isolation in same query
- **Hybrid search single query**: `whereVectorSimilarTo()` + `whereFullText()` combined for dense + sparse retrieval
- **Migration-first**: Define vector columns in migrations like any other column type
- **Index after data load**: Build HNSW index after bulk data loading for faster index creation

- **PostgreSQL + AI = pgvector**: Like PostGIS for geospatial data â€” pgvector adds vector search as a first-class PostgreSQL feature. Same backup, replication, and tooling.
- **One less database**: pgvector eliminates the need for a separate vector database (Pinecone, Qdrant). Your PostgreSQL is also your vector store.

## Architecture Guidelines

- **Decision**: Native Laravel support vs. DBAL/raw SQL â†’ Laravel 13 adds native migration types and query builder support. Reason: No raw SQL needed for 95% of use cases.
- **Decision**: pgvector as default vs. abstract vector store â†’ pgvector is the production default. Reason: Covers 95% of Laravel RAG workloads on existing infrastructure.
- **Decision**: Inline vs. separate table â†’ Inline vector column in document/chunk table. Reason: Enables scoped queries, hybrid search, and ACID without joins.

## Performance Considerations

- HNSW index: sub-10ms p99 for 1M vectors (ef_search=40)
- IVFFlat: faster build, slower query â€” build time ~minutes vs. HNSW hours
- Index build time: 1M vectors Ã— 1536d â†’ HNSW ~1-2 hours, IVFFlat ~10 minutes
- Query time: HNSW ~10ms, IVFFlat ~50ms (at 1M, properly tuned)
- Dimension impact: higher dimensions (3076d) = slower search, more storage
- `ef_search` tuning: increase for recall, decrease for speed (range: 1-1000, default: 40)

| Factor | pgvector | Pinecone | Qdrant |
|--------|----------|---------|--------|
| Infrastructure | Existing PostgreSQL | Separate service | Separate service |
| Scale | Up to 50M vectors | Unlimited | Up to 100M+ |
| ACID | Yes | No | No |
| Hybrid search | Yes (native) | No | Limited |
| Cost | Free (existing DB) | Per-vector pricing | Self-hosted or cloud |
| Maintenance | Standard PostgreSQL | Managed | Self-managed |

## Security Considerations

- Install pgvector extension on PostgreSQL server â€” requires superuser or extension privileges
- Run `CREATE EXTENSION vector` before migrations
- Build index after data load, not during ingestion
- Set `hnsw.ef_search` per query for latency/recall tradeoff
- Monitor index build progress on large datasets
- Consider partitioning for tables exceeding 50M vectors
- Backup strategy: standard PostgreSQL backup includes vector data
- Upgrade path: pgvector versions track PostgreSQL major releases

## Common Mistakes

- Forgetting to install the `vector` extension before migrations â€” migration fails
- Building HNSW index on empty table â€” index build is wasted, rebuild after data load
- Not specifying dimensions in migration â€” different embedding models have different dimensions
- Running `whereVectorSimilarTo` without HNSW index â€” sequential scan on large tables
- Mixing vectors from different embedding models in same column â€” dimension mismatch or semantic mismatch
- Using default `ef_search` for high-recall requirements â€” increase `ef_search` for production recall needs

## Anti-Patterns

- **Extension not installed**: Migration creates vector column but queries fail â€” verify extension exists
- **HNSW index build failure**: Insufficient memory for large index build â€” increase `maintenance_work_mem`
- **Out-of-memory queries**: Very high `ef_search` (1000+) on large datasets â€” memory pressure on PostgreSQL
- **pgvector version mismatch**: Client library incompatible with server extension â€” upgrade both
- **Replication lag**: Hot standby may not support vector index writes â€” configure replication properly

## Examples

The following ecosystem packages provide reference implementations:

- Laravel 13: native `vector()` column type in Schema Builder
- Laravel AI SDK: `SimilaritySearch` tool uses `whereVectorSimilarTo` internally
- Laravel Cloud: Managed PostgreSQL with pgvector pre-installed
- Railway, Supabase, Render: pgvector support in managed PostgreSQL offerings
- Custom Eloquent traits for scoped vector search

## Related Topics

- KU-021: RAG Pipeline with SimilaritySearch
- KU-023: Embedding Generation
- KU-025: Hybrid Search
- KU-029: HNSW Index Tuning
- KU-033: Multi-Tenant Vector Isolation

## AI Agent Notes

- When asked about pgvector Native Support, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

