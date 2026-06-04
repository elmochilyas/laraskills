# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Laravel Pgvector Eloquent
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Laravel Pgvector Eloquent implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Laravel Pgvector Eloquent
- [ ] Full test coverage for Laravel Pgvector Eloquent
- [ ] Security review completed for Laravel Pgvector Eloquent
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Laravel Pgvector Eloquent
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Add vector column in migration: `Schema::table('documents', fn($t) => $t->vector('embedding', 1536))`.
- [ ] Create index: `DB::statement('CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)');`.
- [ ] Define local scope: `scopeSimilarTo($query, $vector, $limit = 10)`.
- [ ] Or use community package for `$model->nearestNeighbors('embedding', $vector)->limit(10)`.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Laravel Pgvector Eloquent following 06-vector-search-systems patterns
- [ ] Configure all required settings for Laravel Pgvector Eloquent
- [ ] Register route/middleware/service for Laravel Pgvector Eloquent
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Vector search on the primary database shares resources with transactional queries.
- [ ] Consider read-replicas for vector search to avoid impacting writes.
- [ ] ANN indexes (HNSW) are needed for performance on datasets >10K vectors.
- [ ] Index build consumes database CPU and memory.

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

- [ ] pgvector extension installed
- [ ] Vector column added to migration
- [ ] ANN index created on vector column
- [ ] Eloquent scope for vector search defined
- [ ] Query returns semantically relevant results
- [ ] Performance benchmarked (impact on transactional queries)
- [ ] Write feature tests for happy path of Laravel Pgvector Eloquent
- [ ] Write feature tests for validation failure of Laravel Pgvector Eloquent
- [ ] Write feature tests for authentication failure of Laravel Pgvector Eloquent
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

- [ ] Avoid: 1 | Premature Community Package Dependency | Maintainability
- [ ] Avoid: 2 | Scattered Raw SQL Without Encapsulation | Code Organization
- [ ] Avoid: 3 | No ANN Index Before Production Traffic | Performance
- [ ] Avoid: 4 | Unbenchmarked Impact on Transactional Queries | Performance
- [ ] Avoid: 5 | Direct SQL Vector Column Changes Without Migration | Maintainability
- [ ] Avoid: No Scout, No Search
- [ ] Avoid: All-in-One-DB Risk
- [ ] Avoid: Migration-Less Schema
- [ ] Avoid: Controller-Level Vector Logic

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
- Vector Database Selection Strategy
- Embedding Generation Approach
- ANN Index Type Selection (HNSW vs IVFFlat)

### Anti-Patterns
- 1 | Premature Community Package Dependency | Maintainability
- 2 | Scattered Raw SQL Without Encapsulation | Code Organization
- 3 | No ANN Index Before Production Traffic | Performance
- 4 | Unbenchmarked Impact on Transactional Queries | Performance
- 5 | Direct SQL Vector Column Changes Without Migration | Maintainability
- No Scout, No Search
- All-in-One-DB Risk
- Migration-Less Schema
- Controller-Level Vector Logic

## Related Knowledge
- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K043 (pgvector distance functions)
- K045 (pgvector + PostgreSQL FTS hybrid)



