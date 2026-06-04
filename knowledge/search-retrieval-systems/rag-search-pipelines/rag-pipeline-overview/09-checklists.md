# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 14-rag-search-pipelines
**Knowledge Unit:** Rag Pipeline Overview
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Rag Pipeline Overview implementation follows 14-rag-search-pipelines patterns
- [ ] All edge cases handled for Rag Pipeline Overview
- [ ] Full test coverage for Rag Pipeline Overview
- [ ] Security review completed for Rag Pipeline Overview
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Rag Pipeline Overview
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Indexing: Batch process (queue job) → chunk → embed → store
- [ ] Query: Controller → embed query → retrieve → re-rank (optional) → augment prompt → LLM call → response
- [ ] Cache embeddings for frequent queries
- [ ] Use queue for document indexing (not inline)
- [ ] Implement fallback: if LLM unavailable, return raw search results
- [ ] Evaluate: RAG Pipeline Architecture Selection
- [ ] Evaluate: Chunking Strategy Selection
- [ ] Evaluate: Embedding Model Selection for RAG

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Rag Pipeline Overview following 14-rag-search-pipelines patterns
- [ ] Configure all required settings for Rag Pipeline Overview
- [ ] Register route/middleware/service for Rag Pipeline Overview
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Total latency = embedding (50-200ms) + retrieval (10-100ms) + optional re-ranking (50-200ms) + generation (500-5000ms)
- [ ] Generation dominates — streaming reduces perceived latency
- [ ] Hybrid retrieval increases recall but adds latency
- [ ] Cache frequent query embeddings to reduce pipeline latency

---

# Security Checklist

- [ ] **Prompt injection**: User queries could attempt to manipulate LLM
- [ ] **Data privacy**: Sensitive data sent to LLM providers
- [ ] **Rate limiting**: Protect LLM API endpoints from abuse
- [ ] **Content filtering**: Ensure generated answers don't contain harmful content
- [ ] **Access control**: Retrieved documents must respect user permissions

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Indexing pipeline implemented (chunk → embed → store)
- [ ] Query pipeline implemented (embed → retrieve → generate)
- [ ] Retrieval quality benchmarked (>80% recall)
- [ ] Citation/source attribution implemented
- [ ] Out-of-scope query handling works
- [ ] Streaming implemented for generation
- [ ] Fallback for LLM unavailability
- [ ] Prompt injection protections in place
- [ ] Write feature tests for happy path of Rag Pipeline Overview
- [ ] Write feature tests for validation failure of Rag Pipeline Overview
- [ ] Write feature tests for authentication failure of Rag Pipeline Overview
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

- [ ] Avoid: 1 | Garbage In, Garbage Out | Architecture
- [ ] Avoid: 2 | Context Window Overload | Performance
- [ ] Avoid: 3 | No Source Attribution | Quality
- [ ] Avoid: 4 | Single Chunk Retrieval | Architecture
- [ ] Avoid: 5 | No Streaming Implementation | UX
- [ ] Avoid: Generation-Before-Retrieval Fallacy
- [ ] Avoid: Context Window Assumption
- [ ] Avoid: Hallucination-As-Feature

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
- 1 | Garbage In, Garbage Out | Architecture
- 2 | Context Window Overload | Performance
- 3 | No Source Attribution | Quality
- 4 | Single Chunk Retrieval | Architecture
- 5 | No Streaming Implementation | UX
- Generation-Before-Retrieval Fallacy
- Context Window Assumption
- Hallucination-As-Feature

## Related Knowledge
- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)
- K062 (Cross-encoder re-ranking)
- K029 (Meilisearch RAG)



