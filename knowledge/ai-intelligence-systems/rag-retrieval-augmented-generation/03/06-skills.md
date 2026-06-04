# Skill: Implement Provider-Agnostic Embedding Service
## Purpose
Build a provider-agnostic embedding service with adapters for different providers (OpenAI, Cohere, Jina, Ollama), supporting batch embedding, caching, and model-version pinning.
## When To Use
- Any RAG pipeline requiring embedding generation
- Multi-provider environments where switching embedding models should not require code changes
- Cost optimization by selecting different providers per workload
## When NOT To Use
- Single-provider applications where provider lock-in is acceptable
- Prototypes using default embedding configuration
## Prerequisites
- Laravel AI SDK or custom embedding abstraction
- At least one embedding provider configured (API key, model name)
- Vector store ready to receive embeddings
## Inputs
- Text content to embed (single or batch)
- Embedding provider/model selection
- Cache configuration (TTL, hash strategy)
- Embedding metadata requirements
## Workflow (numbered)
1. Define provider-agnostic embedding interface with `embed(text)`, `embedMany(texts)`, `getDimensions()`
2. Implement adapter for each provider (OpenAI, Cohere, Jina, Ollama)
3. Pin exact model version in configuration (e.g., `text-embedding-3-small-0125`)
4. Normalize vectors to unit length before storage
5. Cache embeddings by content hash (MD5/SHA256)
6. Batch embedding: group 20-50 texts per API call
7. Store embedding metadata (model, dimensions, normalization flag)
8. Handle rate limits with exponential backoff during batch ingestion
## Validation Checklist
- [ ] Provider-agnostic interface with adapter pattern
- [ ] Embedding model version pinned in config
- [ ] All vectors in same index use same model
- [ ] Vectors normalized to unit length
- [ ] Content-hash caching active
- [ ] Batch embedding configured (20-50 texts per call)
- [ ] Embedding metadata stored
- [ ] Rate-limit handling implemented
## Common Failures
- Tight coupling to specific provider SDK — model migration requires code changes
- Mixing embedding models in same index — dimensionally incompatible
- Not normalizing vectors — incorrect cosine similarity rankings
## Decision Points
- **Embedding model**: text-embedding-3-small (cost-effective, 1536d) vs text-embedding-3-large (highest quality, 3072d)
- **Cache TTL**: 24h for static content; shorter for frequently updated
## Performance Considerations
- Batch embedding reduces per-text overhead 5-10x vs individual calls
- Dimension count affects storage and query speed
## Security Considerations
- Pin model version — switching silently invalidates existing vectors
- Handle rate limits with exponential backoff
- Cache embeddings by content hash — regenerate only changed content
## Related Rules (from 05-rules.md)
- Use a Provider-Agnostic Embedding Interface
- Pin Embedding Model Version in Config
- Never Mix Embedding Models in the Same Index
- Cache Embeddings by Content Hash
- Normalize Vectors Before Storage
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Document Chunking Strategies
## Success Criteria
- Embedding providers swappable via configuration
- Cache reduces embedding API calls by 60-80%
- Model version changes trigger documented re-indexing
- All vectors in same index use consistent model
