# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 07-hybrid-search
**Knowledge Unit:** Milvus Hybrid Search
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Milvus Hybrid Search implementation follows 07-hybrid-search patterns
- [ ] All edge cases handled for Milvus Hybrid Search
- [ ] Full test coverage for Milvus Hybrid Search
- [ ] Security review completed for Milvus Hybrid Search
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Milvus Hybrid Search
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Create collection with both `dense_vector` and `sparse_vector` fields.
- [ ] Milvus generates sparse vectors internally from text input during indexing.
- [ ] Query with both `data` (for sparse vector generation) and `anns_field` (for dense search).
- [ ] Fusion uses RRF internally â€” specify `limit` and `offset` for final pagination.
- [ ] Evaluate: Hybrid Search Fusion Strategy
- [ ] Evaluate: Keyword vs Vector Search Weight Allocation
- [ ] Evaluate: Built-in vs Custom Hybrid Implementation

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Milvus Hybrid Search following 07-hybrid-search patterns
- [ ] Configure all required settings for Milvus Hybrid Search
- [ ] Register route/middleware/service for Milvus Hybrid Search
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Hybrid query latency = max(dense_latency, sparse_latency) + RRF overhead.
- [ ] Sparse vector generation from text is fast (no external API calls).
- [ ] Indexing dual vectors doubles storage requirements.
- [ ] Candidate pool per path affects recall and latency.

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

- [ ] Collection with sparse + dense vector fields created
- [ ] Hybrid queries return combined results
- [ ] Sparse vector generation from text working
- [ ] RRF fusion parameters tuned
- [ ] Individual path recall benchmarked
- [ ] Write feature tests for happy path of Milvus Hybrid Search
- [ ] Write feature tests for validation failure of Milvus Hybrid Search
- [ ] Write feature tests for authentication failure of Milvus Hybrid Search
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

- [ ] Avoid: Missing Sparse Vector Field in Collection Schema
- [ ] Avoid: External Sparse Vector Generation
- [ ] Avoid: Tuning Fusion Without Individual Path Baselines
- [ ] Avoid: Using Milvus Hybrid Without Existing Milvus Investment
- [ ] Avoid: Ignoring Storage Impact of Dual Vector Indexing

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
- Missing Sparse Vector Field in Collection Schema
- External Sparse Vector Generation
- Tuning Fusion Without Individual Path Baselines
- Using Milvus Hybrid Without Existing Milvus Investment
- Ignoring Storage Impact of Dual Vector Indexing

## Related Knowledge
- K059 (Milvus vector database)
- K061 (RRF - Reciprocal Rank Fusion)
- K045 (pgvector + PostgreSQL FTS hybrid)
- K049 (Qdrant hybrid queries)



