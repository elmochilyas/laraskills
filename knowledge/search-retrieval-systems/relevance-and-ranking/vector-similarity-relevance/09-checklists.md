# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 08-relevance-and-ranking
**Knowledge Unit:** Vector Similarity Relevance
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Vector Similarity Relevance implementation follows 08-relevance-and-ranking patterns
- [ ] All edge cases handled for Vector Similarity Relevance
- [ ] Full test coverage for Vector Similarity Relevance
- [ ] Security review completed for Vector Similarity Relevance
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Vector Similarity Relevance

---

# Architecture Checklist

- [ ] Evaluate: Relevance Tuning Strategy
- [ ] Evaluate: BM25 vs Vector Similarity for Relevance
- [ ] Evaluate: Cross-Encoder Reranking Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Vector Similarity Relevance following 08-relevance-and-ranking patterns
- [ ] Configure all required settings for Vector Similarity Relevance
- [ ] Register route/middleware/service for Vector Similarity Relevance
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Cosine similarity on normalized vectors = dot product (fastest)
- [ ] Euclidean distance requires squared differences (slightly slower)
- [ ] ANN indexes abstract distance computation but affect recall
- [ ] Higher dimensions = more compute per distance computation

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

- [ ] Understand vector distance metrics
- [ ] Embedding normalization verified
- [ ] Correct metric chosen for model
- [ ] Hybrid fusion uses RRF not raw scores
- [ ] Write feature tests for happy path of Vector Similarity Relevance
- [ ] Write feature tests for validation failure of Vector Similarity Relevance
- [ ] Write feature tests for authentication failure of Vector Similarity Relevance
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
- K041 (pgvector extension)
- K061 (RRF - Reciprocal Rank Fusion)



