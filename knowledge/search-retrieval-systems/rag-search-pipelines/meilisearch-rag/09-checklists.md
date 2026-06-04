# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 14-rag-search-pipelines
**Knowledge Unit:** Meilisearch Rag
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Meilisearch Rag implementation follows 14-rag-search-pipelines patterns
- [ ] All edge cases handled for Meilisearch Rag
- [ ] Full test coverage for Meilisearch Rag
- [ ] Security review completed for Meilisearch Rag
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Meilisearch Rag
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Requires Meilisearch Cloud subscription for native RAG
- [ ] Custom implementation: use Meilisearch hybrid search â†’ format prompt â†’ call LLM API
- [ ] Include source citations in generated answers
- [ ] Implement fallback to raw search results when LLM is unavailable
- [ ] Evaluate: RAG Pipeline Architecture Selection
- [ ] Evaluate: Chunking Strategy Selection
- [ ] Evaluate: Embedding Model Selection for RAG

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Meilisearch Rag following 14-rag-search-pipelines patterns
- [ ] Configure all required settings for Meilisearch Rag
- [ ] Register route/middleware/service for Meilisearch Rag
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Total latency = retrieval (50-200ms) + generation (500-3000ms)
- [ ] Generation dominates latency â€” stream responses for perceived speed
- [ ] Embedding generation adds ~50-100ms per query if not cached

---

# Security Checklist

- [ ] LLM API keys must be securely stored
- [ ] Retrieved context may contain sensitive data â€” ensure access controls
- [ ] Implement prompt injection protection for user queries
- [ ] Monitor LLM output for harmful content

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write feature tests for happy path of Meilisearch Rag
- [ ] Write feature tests for validation failure of Meilisearch Rag
- [ ] Write feature tests for authentication failure of Meilisearch Rag
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

- [ ] Avoid: 1 | Blind Optimism | Architecture
- [ ] Avoid: 2 | No Citations | Quality
- [ ] Avoid: 3 | Over-Retrieval | Performance
- [ ] Avoid: 4 | Missing Fallback | Reliability
- [ ] Avoid: RAG-Fixes-All Fallacy
- [ ] Avoid: Citation-Free Answers
- [ ] Avoid: LLM-Required Dependency

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
- 1 | Blind Optimism | Architecture
- 2 | No Citations | Quality
- 3 | Over-Retrieval | Performance
- 4 | Missing Fallback | Reliability
- RAG-Fixes-All Fallacy
- Citation-Free Answers
- LLM-Required Dependency

## Related Knowledge
- K028 (Meilisearch hybrid search)
- K067 (Embedding generation strategies)
- K068 (Chunking strategies for RAG)
- K069 (RAG pipeline architecture)



