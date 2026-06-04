# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** rag-pipeline-similarity-search
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Citation format
- [ ] Context window extender
- [ ] Database index for LLM
- [ ] Ingestion pipeline
- [ ] Metadata pre-filtering
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Always Set minSimilarity Threshold
- [ ] Handle Empty Retrieval Results Gracefully
- [ ] Implement Per-User Scoping on Vector Queries
- [ ] Run Document Ingestion as Queued Job
- [ ] `minSimilarity` threshold set (recommended: 0.7-0.8)
- [ ] Document ingestion runs as queued job (not inline)
- [ ] Embedding model version pinned and consistent
- [ ] Agent answers grounded in retrieved documents with citation
- [ ] Cross-tenant data leakage prevented (scoping verified)
- [ ] Document ingestion processes asynchronously without blocking HTTP

---

# Architecture Checklist

- [ ] Built
- [ ] Embedding via SDK vs. external service â†’ `Str::toEmbeddings()` uses configured provider. Reason: Consistent API, automatic provider abstraction
- [ ] pgvector as default vector store â†’ Native Laravel 13 support. Reason: ACID, joins, hybrid search, zero additional infrastructure
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] Citation format
- [ ] Context window extender
- [ ] Database index for LLM
- [ ] Ingestion pipeline
- [ ] Metadata pre-filtering
- [ ] MinSimilarity threshold
- [ ] Open-book exam
- [ ] Per-user scoping
- [ ] Always Set minSimilarity Threshold
- [ ] Handle Empty Retrieval Results Gracefully
- [ ] Implement Per-User Scoping on Vector Queries
- [ ] Run Document Ingestion as Queued Job

---

# Performance Checklist

- [ ] `minSimilarity` filtering reduces irrelevant results but may miss borderline-relevant content
- [ ] Caching embeddings for unchanged content reduces API calls
- [ ] Context injection adds token cost â€” larger context = higher cost per query
- [ ] Embedding generation is I/O bound (HTTP call) â€” batch process documents via queue
- [ ] pgvector HNSW index: sub-10ms search at 1M vectors with proper index tuning
- [ ] Cache embeddings for unchanged content to reduce API calls
- [ ] Embedding generation I/O bound (HTTP call) â€” batch via queue
- [ ] Run document ingestion as queued job â€” not during HTTP request

---

# Security Checklist

- [ ] Implement access control on retrieved documents â€” RAG should respect document permissions
- [ ] Implement document versioning â€” when source updates, re-embed only changed chunks
- [ ] Monitor embedding provider costs â€” embedding generation can dominate for large corpora
- [ ] Run document ingestion as queued job â€” not during HTTP request
- [ ] Set `minSimilarity` based on your content â€” test different thresholds
- [ ] Test retrieval quality with representative queries before deploying
- [ ] Tune `hnsw.ef_search` for latency/recall tradeoff (default 40, increase for higher recall)
- [ ] `minSimilarity` filtering reduces irrelevant results but may miss borderline-relevant content

---

# Reliability Checklist

- [ ] Embedding entire documents as single vectors â€” loses granularity for specific queries
- [ ] Forgetting to re-embed after content updates â€” stale embeddings return incorrect results
- [ ] Mixing embedding models in same index â€” vectors from different models are incomparable
- [ ] No `minSimilarity` threshold â€” irrelevant chunks pollute context, degrade response quality
- [ ] Not handling empty retrieval results â€” agent hallucinates when no context provided
- [ ] Always Set minSimilarity Threshold
- [ ] Handle Empty Retrieval Results Gracefully

---

# Testing Checklist

- [ ] `minSimilarity` threshold set (recommended: 0.7-0.8)
- [ ] Agent answers grounded in retrieved documents with citation
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Cross-tenant data leakage prevented (scoping verified)
- [ ] Document ingestion processes asynchronously without blocking HTTP
- [ ] Document ingestion runs as queued job (not inline)
- [ ] Embedding model version pinned and consistent
- [ ] Empty retrieval results handled gracefully (not hallucination)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No MinSimilarity Threshold â€” Irrelevant Chunks Pollute Context]
- [ ] [Retrieving Without User/Tenant Scoping â€” Cross-User Data Leakage]
- [ ] [Embedding Query Per Request Without Caching]
- [ ] [No Metadata Pre-Filtering Before Vector Search]
- [ ] [Injecting All Retrieved Chunks Without Truncation]
- [ ] Context window overflow
- [ ] Embedding model change
- [ ] Empty retrieval
- [ ] Irrelevant retrieval
- [ ] Metric inversion

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


