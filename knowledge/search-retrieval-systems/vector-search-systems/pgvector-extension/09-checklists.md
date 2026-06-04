# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Pgvector Extension
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pgvector Extension implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Pgvector Extension
- [ ] Full test coverage for Pgvector Extension
- [ ] Security review completed for Pgvector Extension
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pgvector Extension
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Add extension in migration: `DB::statement('CREATE EXTENSION IF NOT EXISTS vector');`.
- [ ] Store vectors as `vector(n)` columns where n matches embedding dimension.
- [ ] Create indexes via raw SQL migration: `CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops);`.
- [ ] Query vectors with distance operators in raw SQL or using scope methods on the model.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Pgvector Extension following 06-vector-search-systems patterns
- [ ] Configure all required settings for Pgvector Extension
- [ ] Register route/middleware/service for Pgvector Extension
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] ANN search with HNSW: sub-10ms for millions of vectors.
- [ ] Index build time: HNSW is O(N log N), IVFFlat is O(N).
- [ ] Vector operations share PostgreSQL's memory and CPU resources.
- [ ] Read replicas can offload vector search traffic from primary.

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

- [ ] CREATE EXTENSION vector executed
- [ ] Vector column added to table with correct dimension
- [ ] ANN index created (HNSW or IVFFlat)
- [ ] Distance operator queries return correct results
- [ ] Index parameters tuned for dataset
- [ ] Write feature tests for happy path of Pgvector Extension
- [ ] Write feature tests for validation failure of Pgvector Extension
- [ ] Write feature tests for authentication failure of Pgvector Extension
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

- [ ] Avoid: 1 | No ANN Index on Vector Column | Performance
- [ ] Avoid: 2 | Wrong Embedding Dimension on Vector Column | Maintainability
- [ ] Avoid: 3 | Manual Extension Installation Outside Migrations | Maintainability
- [ ] Avoid: 4 | Default Index Parameters Without Tuning | Performance
- [ ] Avoid: 5 | Building Large Indexes During Peak Traffic | Performance
- [ ] Avoid: PostgreSQL-Only Narrowness
- [ ] Avoid: Index-Once-Forget
- [ ] Avoid: Raw SQL Avoidance

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
- 1 | No ANN Index on Vector Column | Performance
- 2 | Wrong Embedding Dimension on Vector Column | Maintainability
- 3 | Manual Extension Installation Outside Migrations | Maintainability
- 4 | Default Index Parameters Without Tuning | Performance
- 5 | Building Large Indexes During Peak Traffic | Performance
- PostgreSQL-Only Narrowness
- Index-Once-Forget
- Raw SQL Avoidance

## Related Knowledge
- K042 (pgvector HNSW / IVFFlat indexing)
- K043 (pgvector distance functions)
- K045 (pgvector + PostgreSQL FTS hybrid)
- K070 (Laravel + pgvector via Eloquent)



