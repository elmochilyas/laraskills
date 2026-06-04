# Knowledge Unit: pgvector Native Support

## Metadata

- **ID:** KU-028
- **Subdomain:** Vector Database Integration
- **Slug:** pgvector-native
- **Version:** 1.0.0
- **Maturity:** Stable (Laravel 13 native)
- **Status:** Published

## Executive Summary

pgvector is the default production vector database for Laravel RAG. Laravel 13 provides native support: `vector()` column type in migrations, `whereVectorSimilarTo()` query scope, and `Str::toEmbeddings()` embedding generation. pgvector runs on existing PostgreSQL infrastructure, supports ACID transactions, enables hybrid search (vector + full-text tsvector) in a single query, and requires zero additional services.

## Core Concepts

- `$table->vector('embedding', 1536)`: Migration column type for vector data (dimensions parameter)
- `whereVectorSimilarTo('column', $embedding, 'cosine')`: Eloquent scope for similarity search
- Distance operators: `<=>` (cosine), `<->` (L2/Euclidean), `<#>` (inner product)
- HNSW index: `USING hnsw (embedding vector_cosine_ops)` — sub-10ms search at 1M+ vectors
- IVFFlat index: Faster to build, slower to query — alternative to HNSW
- Hybrid search: Vector similarity + tsvector full-text in single SQL query

## Mental Models

- **PostgreSQL + AI = pgvector**: Like PostGIS for geospatial data — pgvector adds vector search as a first-class PostgreSQL feature. Same backup, replication, and tooling.
- **One less database**: pgvector eliminates the need for a separate vector database (Pinecone, Qdrant). Your PostgreSQL is also your vector store.

## Internal Mechanics

pgvector adds a `vector` data type to PostgreSQL. Vectors are stored inline in table rows (not in a separate index). The HNSW index is a graph-based approximate nearest neighbor index that dramatically accelerates similarity search.

Installation: `CREATE EXTENSION vector;` — available on all major PostgreSQL providers (RDS, Cloud SQL, Supabase, Railway, Laravel Cloud).

Native Laravel 13 integration: `Schema::create('documents', fn ($table) => $table->vector('embedding', 1536))` creates the column. `Model::whereVectorSimilarTo('embedding', $queryEmbedding)->limit(5)->get()` runs the search.

## Patterns

- **Inline vector column**: Vector stored alongside document data in same table — no separate vector store
- **Scoped vector search**: `where('tenant_id', $id)->whereVectorSimilarTo(...)` — tenant isolation in same query
- **Hybrid search single query**: `whereVectorSimilarTo()` + `whereFullText()` combined for dense + sparse retrieval
- **Migration-first**: Define vector columns in migrations like any other column type
- **Index after data load**: Build HNSW index after bulk data loading for faster index creation

## Architectural Decisions

- **Decision**: Native Laravel support vs. DBAL/raw SQL → Laravel 13 adds native migration types and query builder support. Reason: No raw SQL needed for 95% of use cases.
- **Decision**: pgvector as default vs. abstract vector store → pgvector is the production default. Reason: Covers 95% of Laravel RAG workloads on existing infrastructure.
- **Decision**: Inline vs. separate table → Inline vector column in document/chunk table. Reason: Enables scoped queries, hybrid search, and ACID without joins.

## Tradeoffs

| Factor | pgvector | Pinecone | Qdrant |
|--------|----------|---------|--------|
| Infrastructure | Existing PostgreSQL | Separate service | Separate service |
| Scale | Up to 50M vectors | Unlimited | Up to 100M+ |
| ACID | Yes | No | No |
| Hybrid search | Yes (native) | No | Limited |
| Cost | Free (existing DB) | Per-vector pricing | Self-hosted or cloud |
| Maintenance | Standard PostgreSQL | Managed | Self-managed |

## Performance Considerations

- HNSW index: sub-10ms p99 for 1M vectors (ef_search=40)
- IVFFlat: faster build, slower query — build time ~minutes vs. HNSW hours
- Index build time: 1M vectors × 1536d → HNSW ~1-2 hours, IVFFlat ~10 minutes
- Query time: HNSW ~10ms, IVFFlat ~50ms (at 1M, properly tuned)
- Dimension impact: higher dimensions (3076d) = slower search, more storage
- `ef_search` tuning: increase for recall, decrease for speed (range: 1-1000, default: 40)

## Production Considerations

- Install pgvector extension on PostgreSQL server — requires superuser or extension privileges
- Run `CREATE EXTENSION vector` before migrations
- Build index after data load, not during ingestion
- Set `hnsw.ef_search` per query for latency/recall tradeoff
- Monitor index build progress on large datasets
- Consider partitioning for tables exceeding 50M vectors
- Backup strategy: standard PostgreSQL backup includes vector data
- Upgrade path: pgvector versions track PostgreSQL major releases

## Common Mistakes

- Forgetting to install the `vector` extension before migrations — migration fails
- Building HNSW index on empty table — index build is wasted, rebuild after data load
- Not specifying dimensions in migration — different embedding models have different dimensions
- Running `whereVectorSimilarTo` without HNSW index — sequential scan on large tables
- Mixing vectors from different embedding models in same column — dimension mismatch or semantic mismatch
- Using default `ef_search` for high-recall requirements — increase `ef_search` for production recall needs

## Failure Modes

- **Extension not installed**: Migration creates vector column but queries fail — verify extension exists
- **HNSW index build failure**: Insufficient memory for large index build — increase `maintenance_work_mem`
- **Out-of-memory queries**: Very high `ef_search` (1000+) on large datasets — memory pressure on PostgreSQL
- **pgvector version mismatch**: Client library incompatible with server extension — upgrade both
- **Replication lag**: Hot standby may not support vector index writes — configure replication properly

## Ecosystem Usage

- Laravel 13: native `vector()` column type in Schema Builder
- Laravel AI SDK: `SimilaritySearch` tool uses `whereVectorSimilarTo` internally
- Laravel Cloud: Managed PostgreSQL with pgvector pre-installed
- Railway, Supabase, Render: pgvector support in managed PostgreSQL offerings
- Custom Eloquent traits for scoped vector search

## Related Knowledge Units

- KU-021: RAG Pipeline with SimilaritySearch
- KU-023: Embedding Generation
- KU-025: Hybrid Search
- KU-029: HNSW Index Tuning
- KU-033: Multi-Tenant Vector Isolation

## Research Notes

- pgvector introduced in Laravel 13 (March 2026) as native feature
- Before Laravel 13, pgvector required raw SQL or community packages
- `vector()` column type added to `Blueprint` class
- `whereVectorSimilarTo()` added to `Builder` class
- pgvector is the #1 recommended vector store in official Laravel AI SDK documentation
