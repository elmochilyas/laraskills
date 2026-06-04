# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 07-hybrid-search
**Knowledge Unit:** Qdrant Hybrid Queries
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Qdrant Hybrid Queries implementation follows 07-hybrid-search patterns
- [ ] All edge cases handled for Qdrant Hybrid Queries
- [ ] Full test coverage for Qdrant Hybrid Queries
- [ ] Security review completed for Qdrant Hybrid Queries
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Qdrant Hybrid Queries
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Create collection with named vectors: `"dense"` (dense embeddings) and `"sparse"` (sparse vectors).
- [ ] Generate sparse vectors using Qdrant's built-in tokenizer or external sparse embedding models.
- [ ] Query with both named vectors: `query: { "dense": [...], "sparse": {...} }`.
- [ ] Use `fusion` parameter: `"rrf"` for RRF fusion.
- [ ] Payload filtering works transparently with hybrid queries.
- [ ] Evaluate: Hybrid Search Fusion Strategy
- [ ] Evaluate: Keyword vs Vector Search Weight Allocation
- [ ] Evaluate: Built-in vs Custom Hybrid Implementation

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Qdrant Hybrid Queries following 07-hybrid-search patterns
- [ ] Configure all required settings for Qdrant Hybrid Queries
- [ ] Register route/middleware/service for Qdrant Hybrid Queries
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Hybrid query latency = max(dense_latency, sparse_latency) + fusion overhead.
- [ ] Sparse vector search in Qdrant is fast (inverted index-based).
- [ ] Storage doubles (dense + sparse), but Qdrant's quantization helps manage size.
- [ ] RRF fusion adds sub-millisecond overhead.

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

- [ ] Collection with dense + sparse named vectors created
- [ ] Sparse vectors generated from document text
- [ ] Hybrid queries return combined results
- [ ] RRF fusion parameters tuned
- [ ] Payload filtering works with hybrid queries
- [ ] Individual path performance monitored
- [ ] Write feature tests for happy path of Qdrant Hybrid Queries
- [ ] Write feature tests for validation failure of Qdrant Hybrid Queries
- [ ] Write feature tests for authentication failure of Qdrant Hybrid Queries
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

- [ ] Avoid: Missing Dense or Sparse Named Vector in Collection
- [ ] Avoid: External Sparse Vector Generation
- [ ] Avoid: Deploying Hybrid Without Fusion Balance Testing
- [ ] Avoid: Assuming Payload Filtering Works Identically with Hybrid
- [ ] Avoid: Using Qdrant Hybrid Without Existing Qdrant Investment

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
- Hybrid Search Fusion Strategy
- Keyword vs Vector Search Weight Allocation
- Built-in vs Custom Hybrid Implementation

### Anti-Patterns
- Missing Dense or Sparse Named Vector in Collection
- External Sparse Vector Generation
- Deploying Hybrid Without Fusion Balance Testing
- Assuming Payload Filtering Works Identically with Hybrid
- Using Qdrant Hybrid Without Existing Qdrant Investment

## Related Knowledge
- K048 (Qdrant vector search)
- K061 (RRF - Reciprocal Rank Fusion)
- K028 (Meilisearch hybrid search)
- K045 (pgvector + PostgreSQL FTS hybrid)



