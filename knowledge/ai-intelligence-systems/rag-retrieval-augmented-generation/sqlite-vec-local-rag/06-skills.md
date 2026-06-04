# Skill: Implement Local RAG with SQLite-vec for Development
## Purpose
Set up SQLite-vec as a local vector store for RAG development and CI testing, providing zero-infrastructure vector search parity with production pgvector.
## When To Use
- Local RAG development without PostgreSQL infrastructure
- CI testing where pgvector is not available
- Prototyping RAG features before production deployment
## When NOT To Use
- Production workloads — SQLite-vec lacks HNSW indexes, ACID concurrent guarantees, and horizontal scaling
- Any dataset >100K vectors requiring fast search
## Prerequisites
- SQLite-vec extension installed
- `moneo/laravel-rag` package or custom driver
- Local Ollama or API-based embedding provider for development
- Laravel application with SQLite database
## Inputs
- Documents for local indexing
- Embedding provider configuration (Ollama recommended for dev)
- SQLite-vec driver configuration
- Environment-based vector store switching
## Workflow (numbered)
1. Install SQLite-vec extension and `moneo/laravel-rag` or equivalent
2. Configure `config/rag.php` with env-switched vector store: `pgvector` for production, `sqlite-vec` for development
3. Set up Ollama for local embedding generation (zero cost, no API keys)
4. Run document ingestion with local embeddings and SQLite-vec storage
5. Test RAG queries locally with SQLite-vec vector search
6. Verify API compatibility between SQLite-vec and pgvector (SQL syntax parity)
7. Switch to pgvector for production deployment with full re-indexing
## Validation Checklist
- [ ] SQLite-vec extension installed and working
- [ ] Vector store driver env-switched (sqlite-vec for dev, pgvector for production)
- [ ] Embedding provider env-switched (Ollama for dev, production provider for production)
- [ ] Local RAG queries return results with correct similarity scoring
- [ ] SQL syntax compatible between SQLite-vec and pgvector
- [ ] Full re-indexing procedure documented for production switch
## Common Failures
- Using SQLite-vec in production — brute-force kNN causes timeout at scale
- Embedding provider mismatch between dev and production — different embedding spaces
- Assuming SQLite-vec supports same SQL as pgvector — syntax differences exist
- Not testing with representative data volume — performance differs at scale
## Decision Points
- **sqlite-vec vs pgvector in dev**: sqlite-vec for zero-infrastructure; pgvector for production-parity testing
- **Local vs API embeddings**: Ollama for free development; API embeddings for production parity
## Performance Considerations
- SQLite-vec: brute-force kNN only (no HNSW) — O(n) per query
- Usable up to ~100K vectors for interactive queries
- Embedding generation with Ollama: 10-100ms per text locally (CPU-dependent)
## Security Considerations
- SQLite-vec stores vectors in local SQLite database — ensure database file security
- Local embeddings (Ollama) keep data on-premise — suitable for sensitive development data
- No access control built into SQLite-vec — implement at application layer
## Related Rules (from 05-rules.md)
- Use SQLite-vec for Development Only
## Related Skills
- Implement RAG Architecture Pipeline
- Implement Embedding Generation and Caching
- Build RAG Pipeline with Similarity Search
## Success Criteria
- RAG pipeline works identically in dev (SQLite-vec) and production (pgvector)
- Local development requires zero external vector database infrastructure
- CI tests run with SQLite-vec, no pgvector dependency
- Production switch procedure documented with full re-indexing
