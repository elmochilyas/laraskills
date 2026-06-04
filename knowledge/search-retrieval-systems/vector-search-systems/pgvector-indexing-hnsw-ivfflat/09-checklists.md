# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Pgvector Indexing Hnsw Ivfflat
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pgvector Indexing Hnsw Ivfflat implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Pgvector Indexing Hnsw Ivfflat
- [ ] Full test coverage for Pgvector Indexing Hnsw Ivfflat
- [ ] Security review completed for Pgvector Indexing Hnsw Ivfflat
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pgvector Indexing Hnsw Ivfflat
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Pgvector Indexing Hnsw Ivfflat following 06-vector-search-systems patterns
- [ ] Configure all required settings for Pgvector Indexing Hnsw Ivfflat
- [ ] Register route/middleware/service for Pgvector Indexing Hnsw Ivfflat
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Measure response time before and after implementation
- [ ] Add query count monitoring - N+1 detection
- [ ] Use eager loading for all relationships
- [ ] Add caching where appropriate for read-heavy endpoints
- [ ] Profile memory usage for large payloads

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

- [ ] Index type chosen (HNSW or IVFFlat)
- [ ] Index created with appropriate parameters
- [ ] ef_search/probes tuned
- [ ] Query performance measured
- [ ] Recall benchmarked against exact search
- [ ] Rebuild schedule determined
- [ ] Write feature tests for happy path of Pgvector Indexing Hnsw Ivfflat
- [ ] Write feature tests for validation failure of Pgvector Indexing Hnsw Ivfflat
- [ ] Write feature tests for authentication failure of Pgvector Indexing Hnsw Ivfflat
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

- [ ] Avoid: 1 | IVFFlat in Production Without HNSW Consideration | Performance
- [ ] Avoid: 2 | Default ef_search Without Tuning | Performance
- [ ] Avoid: 3 | Never Rebuilding ANN Indexes | Reliability
- [ ] Avoid: 4 | Wrong Index Type for Workload Profile | Architecture
- [ ] Avoid: 5 | Creating Index Without Estimating Build Time | Reliability
- [ ] Avoid: Index-Once-Deploy-Forever
- [ ] Avoid: Memory-Naive HNSW
- [ ] Avoid: Prototype-to-Production Index
- [ ] Avoid: No Recall Baseline

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
- 1 | IVFFlat in Production Without HNSW Consideration | Performance
- 2 | Default ef_search Without Tuning | Performance
- 3 | Never Rebuilding ANN Indexes | Reliability
- 4 | Wrong Index Type for Workload Profile | Architecture
- 5 | Creating Index Without Estimating Build Time | Reliability
- Index-Once-Deploy-Forever
- Memory-Naive HNSW
- Prototype-to-Production Index
- No Recall Baseline

## Related Knowledge
- K041 (pgvector extension)
- K042 (Indexing)
- K013 (Search performance)



