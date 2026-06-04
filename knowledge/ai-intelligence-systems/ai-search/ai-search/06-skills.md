# Skill: Implement Hybrid Search Pipeline with RRF Fusion
## Purpose
Build a production hybrid search pipeline combining vector similarity and keyword full-text search with reciprocal rank fusion (RRF) scoring for superior text retrieval quality.
## When To Use
- Applications needing "search by meaning" not just "search by keywords"
- Content-rich sites (documentation, articles, knowledge bases)
- E-commerce product search where intent matters more than exact terms
- Multilingual search across mixed-language corpora
## When NOT To Use
- Exact-match-only requirements (license plates, serial numbers, IDs)
- High-throughput systems where 200-500ms search latency is unacceptable
- Simple tag/category filtering that doesn't need ranking
- Systems without pgvector or vector database infrastructure
## Prerequisites
- PostgreSQL with pgvector extension or vector database (Qdrant, Pinecone)
- Embedding generation service (Str::toEmbeddings or API)
- HNSW index on vector column
- Full-text search index (tsvector) on text columns
## Inputs
- User search query string
- Embedding model for query vectorization
- RRF constant k (default 60)
- ef_search value (40 for speed, 400 for recall)
- Metadata filter criteria (tenant, date, category)
## Workflow (numbered)
1. Normalize query (lowercase, diacritics, abbreviations)
2. Generate query embedding with content-hash caching
3. Run ANN search with HNSW (top-100, ef_search=400 for recall)
4. Run keyword full-text search with tsquery (top-100)
5. Fuse results using RRF: `sum(1.0 / (k + rank))`
6. Apply metadata filters (tenant ID, date range, category)
7. Optionally rerank top-20 with cross-encoder for precision
8. Return top-10 results with relevance scores
9. Log query and click-through events for relevance tuning
## Validation Checklist
- [ ] Hybrid pipeline (vector + keyword + RRF) implemented, not pure vector
- [ ] HNSW index with tuned m=16, ef_construction=200, ef_search configured
- [ ] Embedding cache with content-hash keys reduces API calls >60%
- [ ] Tenant-aware metadata filtering prevents cross-tenant leakage
- [ ] Search analytics (query logging, click tracking) operational
- [ ] Embedding model version tracked with re-indexing procedure
- [ ] Async queue-based indexing for document ingestion
- [ ] minSimilarity threshold set to avoid irrelevant results
## Common Failures
- Using different embedding models for indexing vs querying
- Setting ef_search too low (<40) causing poor recall
- Not filtering by tenant in multi-tenant systems
- Reranking on wrong document field (title vs body)
- Forgetting minSimilarity threshold — returning irrelevant results
- Mixing embedding models within one index
## Decision Points
- **RRF k value**: Start with k=60; lower for more weight on top ranks, higher for more balanced fusion
- **ef_search tuning**: 400 for high recall (user-facing search), 40 for low latency (autocomplete)
- **Reranking scope**: Rerank top-20 with cross-encoder; reranking 1000 is unnecessary and expensive
- **Synchronous vs async indexing**: Always async for production; sync only for small prototypes
## Performance Considerations
- ANN on 1M vectors: 5-10ms (HNSW, ef_search=40)
- Full hybrid pipeline: 10-20ms (without reranking)
- Reranking 20 items: 200-500ms (API call)
- Embedding generation: 50-150ms per query
- HNSW index memory: ~1.2GB per million vectors (1536d, float32)
## Security Considerations
- Validate and sanitize search queries (SQL injection, NoSQL injection)
- Implement tenant-aware metadata filtering to prevent cross-tenant data leakage
- Never expose raw vector values in API responses
- Rate-limit search endpoints to prevent embedding API cost abuse
- Log anomalous query patterns (potential data scraping)
## Related Rules (from 05-rules.md)
- Always Use Hybrid Search for Text
- Cache Embeddings with Content-Hash Keys
- Tune ef_search for Latency-Recall Tradeoff
- Implement Tenant-Aware Metadata Filtering
- Log Queries and Clicks for Relevance Tuning
- Use Async Queue-Based Indexing
## Related Skills
- Configure and Tune Vector Search Indexes
- Implement RAG Pipeline with Similarity Search
- Implement Embedding Generation and Caching
## Success Criteria
- Search results demonstrate improved recall over pure vector or pure keyword alone
- Query latency within acceptable range for use case (tunable via ef_search)
- Embedding API costs reduced by 60%+ through caching
- Tenant isolation verified — no cross-tenant data leakage in search results
- Search analytics provide data for continuous relevance tuning

---

# Skill: Configure and Tune Vector Search Indexes
## Purpose
Create and optimize HNSW vector indexes on pgvector for production search workloads, balancing recall, latency, and memory consumption through index parameter tuning.
## When To Use
- Setting up vector search for the first time
- Tuning existing indexes after observing query latency or recall issues
- Scaling vector search to larger corpora (1M+ vectors)
## When NOT To Use
- Exact nearest neighbor search required for small datasets (<10K vectors)
- IVFFlat indexes preferred for very large datasets where index build time matters (HNSW builds faster, queries faster, uses more memory)
## Prerequisites
- PostgreSQL with pgvector extension
- Vector column with defined dimensionality (matching embedding model)
- Understanding of HNSW parameters (m, ef_construction, ef_search)
## Inputs
- Vector dimensionality (384, 768, 1536, 3072 depending on embedding model)
- Target recall (0.90, 0.95, 0.99)
- Target query latency (ms)
- Dataset size (number of vectors)
- Available memory for index
## Workflow (numbered)
1. Define vector column: `vector(N)` where N matches embedding model dimensions
2. Create HNSW index: `USING hnsw (vector vector_cosine_ops) WITH (m = 16, ef_construction = 200)`
3. Set ef_search per query session based on latency requirements
4. Benchmark recall at different ef_search values (40, 100, 200, 400)
5. Monitor index memory usage and plan for growth
6. Re-index after embedding model changes
7. Partition vector tables by tenant for multi-tenant isolation
## Validation Checklist
- [ ] Vector column dimension matches embedding model output
- [ ] HNSW index created with appropriate m and ef_construction
- [ ] ef_search configured per query pattern (not one-size-fits-all)
- [ ] Recall measured at chosen ef_search value meets requirements
- [ ] Index memory usage within available RAM
- [ ] Partitioning strategy implemented for multi-tenant setups
- [ ] Re-indexing procedure documented for model changes
## Common Failures
- Creating index with wrong distance operator (cosine vs L2 vs inner product)
- Setting m too high causing excessive memory and build time
- Using default ef_search without considering recall/latency tradeoff
- Not re-indexing after embedding model change — silent quality degradation
- Mixing different embedding models within same index
## Decision Points
- **m (max connections per node)**: 16 (default, good balance), 32 (higher recall, more memory), 8 (lower memory, lower recall)
- **ef_construction (build quality)**: 200 (default), 400 (higher recall, 2x build time), 100 (faster build, lower recall)
- **ef_search (query-time beam width)**: 40 (low latency), 100 (balanced), 400 (high recall)
- **Distance function**: cosine_similarity (default for text), L2 (for normalized vectors), inner_product (for certain models)
## Performance Considerations
- HNSW memory: ~1.2GB per million vectors (1536d, float32)
- Query time: O(log n) per search — scales well to 10M+ vectors
- Build time: 10-60 minutes per million vectors depending on m and ef_construction
- ef_search=400 is ~10x slower than ef_search=40
## Security Considerations
- HNSW indexes can be used for approximate membership inference — consider if dataset is sensitive
- Tenant-partitioned indexes prevent cross-tenant vector search
- Monitor query latency anomalies (potential data extraction attempts)
- Set statement_timeout per query to prevent runaway vector searches
## Related Rules (from 05-rules.md)
- Tune ef_search for Latency-Recall Tradeoff
- Cache Embeddings with Content-Hash Keys
- Implement Tenant-Aware Metadata Filtering
## Related Skills
- Implement Hybrid Search Pipeline with RRF Fusion
- Implement Embedding Generation and Caching
- Select and Implement Vector Database Infrastructure
## Success Criteria
- Vector search meets target recall (e.g., recall@10 > 0.95) at acceptable latency
- Index fits within available memory with 20% headroom for growth
- Tenant-partitioned indexes provide data isolation
- Re-indexing procedure tested and documented for model changes
