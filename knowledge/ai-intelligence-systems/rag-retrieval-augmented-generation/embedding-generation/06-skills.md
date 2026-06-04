# Skill: Implement Embedding Generation and Caching
## Purpose
Configure and optimize embedding generation using the Laravel AI SDK's `Str::toEmbeddings()` with model pinning, batch processing, content-hash caching, and vector normalization for production RAG pipelines.
## When To Use
- Setting up embedding generation for a new RAG pipeline
- Optimizing embedding costs and performance for large corpora
- Migrating between embedding models (with re-indexing)
## When NOT To Use
- Prototypes where default embedding configuration is sufficient
- When only local development embedding is needed (Ollama)
## Prerequisites
- Laravel AI SDK with embedding provider configured
- pgvector column defined with correct dimensions
- Understanding of embedding models and dimensionality
## Inputs
- Text content to embed (single or batch)
- Embedding model configuration (provider, model name, dimensions)
- Cache configuration (TTL, hash strategy)
- Batch size for API efficiency
## Workflow (numbered)
1. Pin exact embedding model version in configuration (e.g., `text-embedding-3-small-0125`)
2. Use exactly one embedding model per vector index — never mix models
3. Normalize vectors to unit length before storage for correct cosine similarity
4. Implement content-hash caching: `Cache::remember("embedding:" . md5($text), ttl, ...)`
5. Batch embedding calls: group chunks into batches of 20-50 for API efficiency
6. Store embedding metadata (model name, dimensions, normalization flag) alongside vector
7. Implement rate-limit handling with exponential backoff for batch ingestion
8. On model change: re-embed entire corpus with new model version
## Validation Checklist
- [ ] Embedding model version pinned in config (not bare model name)
- [ ] Same model used for all vectors in the same index
- [ ] Vectors normalized to unit length before storage
- [ ] Content-hash caching active, reducing API calls by 60-80%
- [ ] Batch embedding configured (20-50 texts per call)
- [ ] Embedding metadata stored (model, dimensions, normalization flag)
- [ ] Rate-limit handling with backoff for large ingestion jobs
- [ ] Re-indexing procedure documented for model changes
## Common Failures
- Mixing embedding models in same pgvector index — dimensionally incompatible
- Not normalizing vectors — cosine similarity with unnormalized vectors incorrect
- Embedding entire documents as single vectors — loses granularity
- Changing model without re-embedding — old vectors become garbage
- Ignoring batch limits — some providers limit batch size
- Storing embeddings without metadata — can't diagnose retrieval issues
## Decision Points
- **Embedding model selection**: text-embedding-3-small (cost-effective, 1536d) vs text-embedding-3-large (highest quality, 3072d)
- **Cache TTL**: 24h for static content; shorter for frequently updated; no cache for real-time content
- **Normalization**: Always normalize for cosine similarity; skip if using L2 distance
## Performance Considerations
- Embedding API calls: 100-500ms per batch of 20 texts
- Batch embedding reduces per-text overhead 5-10x vs individual calls
- Dimension count affects storage and query speed (1536d vs 3072d: 2x storage)
- pgvector HNSW performance inversely correlated with dimension count
- Normalization is cheap (microseconds) — always normalize
## Security Considerations
- Monitor embedding provider costs — cost adds up at scale
- Cache embeddings by content hash — regenerate only changed content
- Pin embedding model version — switching silently invalidates existing vectors
- Implement batch processing via queue for large ingestion jobs
- Handle embedding provider rate limits with exponential backoff
## Related Rules (from 05-rules.md)
- Pin Embedding Model Version in Config
- Never Mix Embedding Models in the Same Index
- Cache Embeddings by Content Hash
- Normalize Vectors Before Storage
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Document Chunking Strategies
- Build RAG Pipeline with Similarity Search
## Success Criteria
- Embedding API costs reduced 60-80% through caching
- All vectors in each index use same model (verified)
- Vectors normalized for correct cosine similarity
- Model changes trigger documented re-indexing process
- Batch embedding processes large corpora efficiently within rate limits
