# Skill: Build RAG Pipeline with Similarity Search
## Purpose
Implement a complete RAG pipeline using the Laravel AI SDK's built-in `SimilaritySearch` tool, `Str::toEmbeddings()`, and pgvector for scalable, production-ready document grounding.
## When To Use
- Support chatbots with documentation grounding
- Code/documentation search for developer tools
- Internal knowledge base Q&A systems
- Legal document analysis with citation requirements
## When NOT To Use
- Simple lookup that doesn't need vector search
- High-throughput systems where any retrieval latency is unacceptable
- Before evaluating whether context fits in system prompt alone
## Prerequisites
- Laravel AI SDK with embedding provider configured
- PostgreSQL with pgvector extension
- Document model with vector column defined
- Queue infrastructure for async indexing
## Inputs
- Documents to index (content, metadata)
- Query text from user
- minSimilarity threshold configuration
- top-K retrieval count
- Tenant/user context for scoping
## Workflow (numbered)
1. Create document model with `vector()` column matching embedding dimensions
2. Build async queue job for document ingestion (chunking + embedding generation)
3. Use `Str::toEmbeddings()` for embedding generation during indexing
4. Run document ingestion via queued job — never in HTTP request lifecycle
5. Implement query with `whereVectorSimilarTo('embedding', $embedding, 'cosine', $minSimilarity)`
6. Always combine vector query with tenant/user filter for access control
7. Handle empty retrieval results — instruct agent to say "I don't know"
8. Inject retrieved context into agent system prompt with citation format
9. Configure HNSW index on vector column for fast search
## Validation Checklist
- [ ] Document ingestion runs as queued job (not inline)
- [ ] `minSimilarity` threshold set (recommended: 0.7-0.8)
- [ ] Per-user/tenant scoping applied to all vector queries
- [ ] Empty retrieval results handled gracefully (not hallucination)
- [ ] HNSW index created on vector column
- [ ] Embedding model version pinned and consistent
- [ ] Retrieved context formatted with citation metadata
## Common Failures
- Embedding entire documents as single vectors — loses granularity
- No `minSimilarity` threshold — irrelevant chunks pollute context
- Mixing embedding models in same index — vectors incomparable
- Not handling empty retrieval — agent hallucinates without context
- Forgetting to re-embed after content updates — stale embeddings
## Decision Points
- **Built-in SimilaritySearch vs custom retrieval**: Built-in for standard cases; custom for hybrid search or reranking
- **pgvector vs other vector stores**: pgvector for ACID, joins, hybrid search with zero additional infrastructure
- **Embedding via SDK vs external service**: `Str::toEmbeddings()` for consistent API and provider abstraction
## Performance Considerations
- Embedding generation I/O bound (HTTP call) — batch via queue
- pgvector HNSW: sub-10ms search at 1M vectors with proper tuning
- Context injection adds token cost — larger context = higher cost per query
- `minSimilarity` filtering reduces irrelevant results but may miss borderline-relevant content
- Cache embeddings for unchanged content to reduce API calls
## Security Considerations
- Run document ingestion as queued job — not during HTTP request
- Always filter by tenant/user — prevent cross-tenant data leakage
- Sanitize retrieved documents for prompt injection before context injection
- Implement document versioning — re-embed only changed chunks
- Respect document permissions in retrieval results
## Related Rules (from 05-rules.md)
- Always Set `minSimilarity` Threshold
- Run Document Ingestion as Queued Job
- Implement Per-User Scoping on Vector Queries
- Handle Empty Retrieval Results Gracefully
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Document Chunking Strategies
- Implement Embedding Generation and Caching
## Success Criteria
- Agent answers grounded in retrieved documents with citation
- No irrelevant chunks pollute LLM context (minSimilarity enforced)
- Cross-tenant data leakage prevented (scoping verified)
- Empty retrieval results produce "I don't know" response
- Document ingestion processes asynchronously without blocking HTTP
