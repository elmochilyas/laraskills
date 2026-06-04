# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 08-relevance-and-ranking
**Knowledge Unit:** Tf Idf Bm25
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Tf Idf Bm25 implementation follows 08-relevance-and-ranking patterns
- [ ] All edge cases handled for Tf Idf Bm25
- [ ] Full test coverage for Tf Idf Bm25
- [ ] Security review completed for Tf Idf Bm25
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Tf Idf Bm25

---

# Architecture Checklist

- [ ] BM25 is the default ranking for most search engines (Meilisearch, Elasticsearch, PostgreSQL FTS)
- [ ] MySQL FULLTEXT uses TF-IDF
- [ ] Scout engines abstract BM25 configuration — fine-tuning requires engine-specific API
- [ ] Evaluate: Relevance Tuning Strategy
- [ ] Evaluate: BM25 vs Vector Similarity for Relevance
- [ ] Evaluate: Cross-Encoder Reranking Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Tf Idf Bm25 following 08-relevance-and-ranking patterns
- [ ] Configure all required settings for Tf Idf Bm25
- [ ] Register route/middleware/service for Tf Idf Bm25
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] BM25 computation is O(1) per term-document pair (pre-computed in inverted index)
- [ ] Ranking computation adds negligible latency at query time
- [ ] Index storage includes term frequency information

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

- [ ] Understand TF-IDF formula
- [ ] Understand BM25 formula
- [ ] Know k1 and b parameter effects
- [ ] Test BM25 tuning on corpus
- [ ] Write feature tests for happy path of Tf Idf Bm25
- [ ] Write feature tests for validation failure of Tf Idf Bm25
- [ ] Write feature tests for authentication failure of Tf Idf Bm25
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

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

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

## Related Knowledge
- K030 (Meilisearch ranking rules)
- K015 (SearchUsingFullText)



