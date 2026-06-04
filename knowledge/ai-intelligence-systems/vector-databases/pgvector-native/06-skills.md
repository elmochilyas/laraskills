# Skill: Implement pgvector Vector Search in Laravel
## Purpose
Configure pgvector extension, create vector columns, build HNSW indexes, and implement similarity search using Laravel 13's native `vector()` column type and `whereVectorSimilarTo()` scope.
## When To Use
- Any RAG or semantic search implementation in Laravel
- Production vector search on existing PostgreSQL infrastructure
- Hybrid search combining vector + full-text search
## When NOT To Use
- Without PostgreSQL (use SQLite-vec for dev, Qdrant/Pinecone for production)
- For very large datasets (>50M vectors) where pgvector may not suffice
## Prerequisites
- PostgreSQL 13+ with pgvector extension
- Laravel 13 with native vector support or laravel/ai SDK
- Embedding model configured and generating vectors
## Inputs
- Vector dimension (1536 for OpenAI text-embedding-3-small)
- Distance metric (cosine, L2, inner product)
- HNSW index parameters (m, ef_construction)
- Embedding data to store and query
## Workflow (numbered)
1. Install pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector`
2. Create migration with `$table->vector('embedding', 1536)` column
3. Create HNSW index: `CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200)`
4. Store normalized embeddings in vector column
5. Query with `whereVectorSimilarTo('embedding', $embedding, 'cosine', $minSimilarity)`
6. Set ef_search per query based on latency requirements
7. Optionally combine with full-text search via tsvector for hybrid search
## Validation Checklist
- [ ] pgvector extension installed before migrations run
- [ ] Vector column dimension matches embedding model output
- [ ] HNSW index created with appropriate m and ef_construction
- [ ] ef_search configurable per query pattern
- [ ] Vectors normalized before storage
- [ ] Similarity search returns correctly ranked results
- [ ] Tenant/access control filters applied on queries
## Common Failures
- Migrating without installing extension first — cryptic error
- Vector column dimensions don't match embedding model — runtime error
- Creating HNSW index on wrong distance operator — incorrect rankings
- Not normalizing vectors — incorrect cosine similarity
## Decision Points
- **Distance metric**: cosine (default for text), L2/Euclidean (for normalized vectors), inner_product (for certain models)
- **HNSW vs IVFFlat**: HNSW for production (faster query, slower build); IVFFlat for prototyping (faster build, slower query)
## Performance Considerations
- HNSW index: sub-10ms search at 1M+ vectors
- Index memory: ~1.2GB per million vectors (1536d)
- ef_search=40: ~5ms; ef_search=400: ~50ms
- Query time: O(log n) — scales well to 10M+ vectors
## Security Considerations
- Validate user input to vector queries to prevent injection
- Apply tenant/access control filters on every vector query
- Use read replicas for vector search under high load
- Monitor query latency anomalies (potential data extraction)
## Related Rules (from 05-rules.md)
- Install the Vector Extension Before Migrations
- Tune ef_search Per-Query Based on Latency Budget
## Related Skills
- Configure and Tune Vector Search Indexes
- Implement Multi-Tenant Vector Isolation
- Implement Hybrid Search with RRF Fusion
## Success Criteria
- Vector search returns correct similarity-ranked results
- HNSW index provides sub-10ms search at target dataset size
- ef_search tunable per query for latency/recall tradeoff
- Migration includes extension installation check
