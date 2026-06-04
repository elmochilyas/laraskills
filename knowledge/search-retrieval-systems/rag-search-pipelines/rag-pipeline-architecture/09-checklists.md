# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 14-rag-search-pipelines
**Knowledge Unit:** Rag Pipeline Architecture
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rag Pipeline Architecture implementation follows 14-rag-search-pipelines patterns
- [ ] All edge cases handled for Rag Pipeline Architecture
- [ ] Full test coverage for Rag Pipeline Architecture
- [ ] Security review completed for Rag Pipeline Architecture
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rag Pipeline Architecture
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Build as a custom Laravel service: Scout/pgvector for retrieval, HTTP clients for LLM APIs
- [ ] Separate indexing pipeline (offline/batch) from query pipeline (online/realtime)
- [ ] Use hybrid retrieval for production-grade recall
- [ ] Implement caching at every stage: embeddings, query results, generation
- [ ] Evaluate: RAG Pipeline Architecture Selection
- [ ] Evaluate: Chunking Strategy Selection
- [ ] Evaluate: Embedding Model Selection for RAG

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Rag Pipeline Architecture following 14-rag-search-pipelines patterns
- [ ] Configure all required settings for Rag Pipeline Architecture
- [ ] Register route/middleware/service for Rag Pipeline Architecture
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Total latency = embedding (50-200ms) + retrieval (10-100ms) + optional re-ranking (50-200ms) + generation (500-5000ms)
- [ ] Generation dominates â€” streaming reduces perceived latency
- [ ] Hybrid retrieval adds latency (two searches) but increases recall
- [ ] Cache frequent query embeddings to reduce pipeline latency

---

# Security Checklist

- [ ] Implement prompt injection protection for user queries
- [ ] Apply document-level access controls before passing context to LLM
- [ ] LLM API keys require secure storage
- [ ] Monitor for data leakage in generated responses
- [ ] Rate-limit RAG endpoints to control API costs

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Rag Pipeline Architecture
- [ ] Write feature tests for validation failure of Rag Pipeline Architecture
- [ ] Write feature tests for authentication failure of Rag Pipeline Architecture
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid: 1 | Skip Retrieval Testing | Architecture
- [ ] Avoid: 2 | No Access Controls | Security
- [ ] Avoid: 3 | Infinite Context | Performance
- [ ] Avoid: 4 | No Fallback | Reliability
- [ ] Avoid: Generation-Before-Retrieval Syndrome
- [ ] Avoid: Context Without Permissions
- [ ] Avoid: Single-Point-of-Failure Pipeline

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Rule Name

### Decisions
- RAG Pipeline Architecture Selection
- Chunking Strategy Selection
- Embedding Model Selection for RAG

### Anti-Patterns
- 1 | Skip Retrieval Testing | Architecture
- 2 | No Access Controls | Security
- 3 | Infinite Context | Performance
- 4 | No Fallback | Reliability
- Generation-Before-Retrieval Syndrome
- Context Without Permissions
- Single-Point-of-Failure Pipeline

## Related Knowledge
- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)
- K029 (Meilisearch RAG)
- K062 (Cross-encoder re-ranking)
- K061 (RRF - Reciprocal Rank Fusion)



