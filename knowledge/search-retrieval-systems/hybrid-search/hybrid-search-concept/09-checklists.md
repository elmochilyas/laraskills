# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 07-hybrid-search
**Knowledge Unit:** Hybrid Search Concept
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Hybrid Search Concept implementation follows 07-hybrid-search patterns
- [ ] All edge cases handled for Hybrid Search Concept
- [ ] Full test coverage for Hybrid Search Concept
- [ ] Security review completed for Hybrid Search Concept
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Hybrid Search Concept
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Engine-level (simplest): Meilisearch, Typesense, Qdrant, Milvus native hybrid
- [ ] Database-level: pgvector + PostgreSQL FTS with RRF in SQL
- [ ] Application-level: Query two engines separately, fuse in PHP
- [ ] Microservice-level: Dedicated hybrid service for multi-engine fusion
- [ ] Evaluate: Hybrid Search Fusion Strategy
- [ ] Evaluate: Keyword vs Vector Search Weight Allocation
- [ ] Evaluate: Built-in vs Custom Hybrid Implementation

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Hybrid Search Concept following 07-hybrid-search patterns
- [ ] Configure all required settings for Hybrid Search Concept
- [ ] Register route/middleware/service for Hybrid Search Concept
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Hybrid search latency ≈ max(keyword_latency, vector_latency) + fusion_overhead
- [ ] Fusion overhead: RRF ~1ms, weighted ~1ms, cross-encoder 50-200ms
- [ ] Dual indexing doubles storage and memory requirements
- [ ] Candidate pool size vs latency tradeoff: larger pool = better recall but slower

---

# Security Checklist

- [ ] Each retrieval path has its own security model (API keys, auth)
- [ ] Embedding queries may send data to external API providers
- [ ] Fusion layer must handle partial failures (one path down)
- [ ] Ensure consistent access control across both retrieval paths

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Keyword search baseline established
- [ ] Vector search capabilities available (pgvector, Qdrant, etc.)
- [ ] Fusion method chosen (RRF/weighted/cross-encoder)
- [ ] Hybrid search benchmarked against keyword-only
- [ ] Candidate pool size tuned
- [ ] Fusion balance monitored
- [ ] Write feature tests for happy path of Hybrid Search Concept
- [ ] Write feature tests for validation failure of Hybrid Search Concept
- [ ] Write feature tests for authentication failure of Hybrid Search Concept
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

- [ ] Avoid: Fusion as Band-Aid for Poor Retrieval
- [ ] Avoid: Sequential Query Execution
- [ ] Avoid: Unlimited Candidate Pooling
- [ ] Avoid: Unnormalized Score-Based Fusion
- [ ] Avoid: Ignoring Individual Path Quality

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
- Fusion as Band-Aid for Poor Retrieval
- Sequential Query Execution
- Unlimited Candidate Pooling
- Unnormalized Score-Based Fusion
- Ignoring Individual Path Quality

## Related Knowledge
- K045 (pgvector + FTS hybrid)
- K049 (Qdrant hybrid queries)
- K061 (RRF - Reciprocal Rank Fusion)
- K062 (Cross-encoder re-ranking)
- K028 (Meilisearch hybrid search)



