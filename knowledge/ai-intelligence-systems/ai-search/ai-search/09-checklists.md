# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-search
**Knowledge Unit:** 06-ai-search
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Async queue-based indexing for document ingestion
- [ ] Embedding cache with content-hash keys reduces API calls by >60%
- [ ] Embedding model version is tracked and re-indexing procedure exists
- [ ] Always Use Hybrid Search for Text
- [ ] Cache Embeddings with Content-Hash Keys
- [ ] Implement Tenant-Aware Metadata Filtering
- [ ] Log Queries and Clicks for Relevance Tuning
- [ ] Tune ef_search for Latency-Recall Tradeoff
- [ ] Async queue-based indexing for document ingestion
- [ ] ef_search configured per query pattern (not one-size-fits-all)
- [ ] Embedding cache with content-hash keys reduces API calls >60%
- [ ] Embedding API costs reduced by 60%+ through caching
- [ ] Index fits within available memory with 20% headroom for growth
- [ ] Query latency within acceptable range for use case (tunable via ef_search)

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement graceful degradation with fallback content
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy
- [ ] Implement retry with exponential backoff and jitter

---

# Implementation Checklist

- [ ] Always Use Hybrid Search for Text
- [ ] Cache Embeddings with Content-Hash Keys
- [ ] Implement Tenant-Aware Metadata Filtering
- [ ] Log Queries and Clicks for Relevance Tuning
- [ ] Tune ef_search for Latency-Recall Tradeoff
- [ ] Use Async Queue-Based Indexing
- [ ] Distance function
- [ ] ef_construction (build quality)
- [ ] ef_search (query-time beam width)
- [ ] ef_search tuning
- [ ] m (max connections per node)
- [ ] Reranking scope

---

# Performance Checklist

- [ ] ANN on 1M vectors: 5-10ms (HNSW, ef_search=40)
- [ ] Batch embedding (100 docs): 200-500ms
- [ ] Embedding generation: 50-150ms per query
- [ ] Full hybrid pipeline: 10-20ms (without reranking)
- [ ] HNSW index memory: ~1.2GB per million vectors (1536d, float32)
- [ ] Reranking 20 items: 200-500ms (API call)
- [ ] Total with reranking: 250-550ms per query
- [ ] HNSW index memory: ~1.2GB per million vectors (1536d, float32)

---

# Security Checklist

- [ ] Implement tenant-aware metadata filtering to prevent cross-tenant data leakage
- [ ] Log anomalous query patterns (potential data scraping)
- [ ] Never expose raw vector values in API responses
- [ ] Rate-limit search endpoints to prevent embedding API cost abuse
- [ ] Validate and sanitize search queries (injection prevention)
- [ ] Implement tenant-aware metadata filtering to prevent cross-tenant data leakage
- [ ] Rate-limit search endpoints to prevent embedding API cost abuse
- [ ] Validate and sanitize search queries (SQL injection, NoSQL injection)

---

# Reliability Checklist

- [ ] Forgetting `minSimilarity` threshold â€” returning irrelevant results
- [ ] Mixing embedding models in one index
- [ ] Not filtering by tenant in multi-tenant systems
- [ ] Reranking on wrong document field (title vs. body)
- [ ] Setting `ef_search` too low (<40) causing poor recall
- [ ] Using different embedding models for indexing vs. querying
- [ ] Always Use Hybrid Search for Text

---

# Testing Checklist

- [ ] Async queue-based indexing for document ingestion
- [ ] ef_search configured per query pattern (not one-size-fits-all)
- [ ] Embedding API costs reduced by 60%+ through caching
- [ ] Embedding cache with content-hash keys reduces API calls >60%
- [ ] Embedding cache with content-hash keys reduces API calls by >60%
- [ ] Embedding model version is tracked and re-indexing procedure exists
- [ ] Embedding model version tracked with re-indexing procedure
- [ ] HNSW index created with appropriate m and ef_construction
- [ ] HNSW index with tuned ef_search (40 for speed, 400 for recall) is configured
- [ ] HNSW index with tuned m=16, ef_construction=200, ef_search configured

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] No Query Normalization:
- [ ] No Relevance Threshold:
- [ ] Pure Vector-Only Search:
- [ ] Reranking Everything:
- [ ] Synchronous Indexing:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log anomalous query patterns (potential data scraping)
- [ ] Monitor query latency anomalies (potential data extraction attempts)
- [ ] Query time: O(log n) per search â€” scales well to 10M+ vectors

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


