# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 07-hybrid-search
**Knowledge Unit:** Pgvector Fts Hybrid
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pgvector Fts Hybrid implementation follows 07-hybrid-search patterns
- [ ] All edge cases handled for Pgvector Fts Hybrid
- [ ] Full test coverage for Pgvector Fts Hybrid
- [ ] Security review completed for Pgvector Fts Hybrid
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pgvector Fts Hybrid
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Add `tsvector` column with generated-always expression for FTS.
- [ ] Add `vector` column for embeddings.
- [ ] Create RRF SQL function or use application-level fusion.
- [ ] For application-level fusion: use Laravel's HTTP client pools for parallel queries.
- [ ] Evaluate: Hybrid Search Fusion Strategy
- [ ] Evaluate: Keyword vs Vector Search Weight Allocation
- [ ] Evaluate: Built-in vs Custom Hybrid Implementation

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Pgvector Fts Hybrid following 07-hybrid-search patterns
- [ ] Configure all required settings for Pgvector Fts Hybrid
- [ ] Register route/middleware/service for Pgvector Fts Hybrid
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Hybrid query is more expensive than either path alone â€” expected.
- [ ] RRF fusion in SQL adds minimal overhead (<1ms).
- [ ] GIN and HNSW indexes must be maintained (write overhead).
- [ ] Read replicas can offload hybrid search from primary database.

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

- [ ] tsvector column with GIN index created
- [ ] vector column with HNSW index created
- [ ] RRF fusion implemented (SQL or PHP)
- [ ] Individual path recall benchmarked
- [ ] Hybrid recall improvement measured over single-path
- [ ] Candidate pool size tuned
- [ ] Write feature tests for happy path of Pgvector Fts Hybrid
- [ ] Write feature tests for validation failure of Pgvector Fts Hybrid
- [ ] Write feature tests for authentication failure of Pgvector Fts Hybrid
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

- [ ] Avoid: Missing GIN or HNSW Index for Hybrid Search
- [ ] Avoid: Application-Level Fusion When SQL RRF Suffices
- [ ] Avoid: Tuning Hybrid Without Individual Path Baselines
- [ ] Avoid: Using pgvector + FTS for High-Volume Search
- [ ] Avoid: Ignoring Write Overhead of Dual Indexes

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
- Missing GIN or HNSW Index for Hybrid Search
- Application-Level Fusion When SQL RRF Suffices
- Tuning Hybrid Without Individual Path Baselines
- Using pgvector + FTS for High-Volume Search
- Ignoring Write Overhead of Dual Indexes

## Related Knowledge
- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K061 (RRF - Reciprocal Rank Fusion)
- K028 (Meilisearch hybrid search)
- K049 (Qdrant hybrid queries)



