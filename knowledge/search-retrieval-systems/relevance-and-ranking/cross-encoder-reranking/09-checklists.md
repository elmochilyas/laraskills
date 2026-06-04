# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 08-relevance-and-ranking
**Knowledge Unit:** Cross Encoder Reranking
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Cross Encoder Reranking implementation follows 08-relevance-and-ranking patterns
- [ ] All edge cases handled for Cross Encoder Reranking
- [ ] Full test coverage for Cross Encoder Reranking
- [ ] Security review completed for Cross Encoder Reranking
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Cross Encoder Reranking
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Two-stage pipeline: ANN retrieves top-K candidates â†’ cross-encoder scores and re-ranks.
- [ ] Candidate pool size: typically 20-100 (more = better recall, higher latency).
- [ ] For PHP/Laravel: call re-ranker API (Cohere) or local service (FastEmbed).
- [ ] Implement circuit breaker: fall back to ANN if re-ranker fails.
- [ ] Evaluate: Relevance Tuning Strategy
- [ ] Evaluate: BM25 vs Vector Similarity for Relevance
- [ ] Evaluate: Cross-Encoder Reranking Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Cross Encoder Reranking following 08-relevance-and-ranking patterns
- [ ] Configure all required settings for Cross Encoder Reranking
- [ ] Register route/middleware/service for Cross Encoder Reranking
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Latency proportional to candidate count: 10 docs ~30ms, 100 docs ~300ms.
- [ ] GPU accelerates inference 10-50x vs CPU.
- [ ] Model size matters: bge-reranker-v2-m3 (568MB) vs Cohere API call.
- [ ] Batching candidates (batch of 20) is ~50% faster than sequential scoring.

---

# Security Checklist

- [ ] Validate all input - never trust client data
- [ ] Apply authorization checks for every operation
- [ ] Sanitize output to prevent injection attacks
- [ ] Rate limit exposed endpoints
- [ ] Log security-relevant events

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] First-pass retrieval implemented (ANN or keyword)
- [ ] Candidate pool size configured (20-100)
- [ ] Cross-encoder model selected and integrated
- [ ] Latency budget includes re-ranking overhead
- [ ] Fallback to ANN order implemented
- [ ] Accuracy improvement measured vs baseline
- [ ] Write feature tests for happy path of Cross Encoder Reranking
- [ ] Write feature tests for validation failure of Cross Encoder Reranking
- [ ] Write feature tests for authentication failure of Cross Encoder Reranking
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

- [ ] Avoid: Re-Ranking Entire Document Collection
- [ ] Avoid: No Fallback When Cross-Encoder Fails
- [ ] Avoid: Deploying Without Measuring NDCG Improvement
- [ ] Avoid: Re-Ranking Too Few Candidates
- [ ] Avoid: Using Cross-Encoder for Latency-Sensitive Apps

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
- Relevance Tuning Strategy
- BM25 vs Vector Similarity for Relevance
- Cross-Encoder Reranking Strategy

### Anti-Patterns
- Re-Ranking Entire Document Collection
- No Fallback When Cross-Encoder Fails
- Deploying Without Measuring NDCG Improvement
- Re-Ranking Too Few Candidates
- Using Cross-Encoder for Latency-Sensitive Apps

## Related Knowledge
- K054 (Qdrant cross-encoder re-ranking)
- K053 (Qdrant FastEmbed)
- K069 (RAG pipeline architecture)
- K061 (RRF - Reciprocal Rank Fusion)



