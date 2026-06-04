# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Pgvector Hnsw Ivfflat
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pgvector Hnsw Ivfflat implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Pgvector Hnsw Ivfflat
- [ ] Full test coverage for Pgvector Hnsw Ivfflat
- [ ] Security review completed for Pgvector Hnsw Ivfflat
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pgvector Hnsw Ivfflat
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Create HNSW: `CREATE INDEX ON items USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);`
- [ ] Create IVFFlat: `CREATE INDEX ON items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`
- [ ] Query tuning: `SET hnsw.ef_search = 200;` or `SET ivfflat.probes = 10;`.
- [ ] Drop and recreate indexes during major data changes for optimal structure.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Pgvector Hnsw Ivfflat following 06-vector-search-systems patterns
- [ ] Configure all required settings for Pgvector Hnsw Ivfflat
- [ ] Register route/middleware/service for Pgvector Hnsw Ivfflat
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

- [ ] Index type chosen (HNSW or IVFFlat) based on workload
- [ ] Index parameters tuned (m, ef_construction for HNSW; lists for IVFFlat)
- [ ] Query parameters configured (ef_search, probes)
- [ ] Index build time and recall benchmarked
- [ ] Index rebuild strategy documented
- [ ] Write feature tests for happy path of Pgvector Hnsw Ivfflat
- [ ] Write feature tests for validation failure of Pgvector Hnsw Ivfflat
- [ ] Write feature tests for authentication failure of Pgvector Hnsw Ivfflat
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

- [ ] Avoid: 1 | Production IVFFlat Without HNSW Evaluation | Performance
- [ ] Avoid: 2 | Default ef_search Without Workload Tuning | Performance
- [ ] Avoid: 3 | Index Degradation Without Rebuild Strategy | Reliability
- [ ] Avoid: 4 | Same Index Type for All Workloads | Architecture
- [ ] Avoid: 5 | Ignoring Benchmark Step Before Index Choice | Testing
- [ ] Avoid: Static Index Mindset
- [ ] Avoid: One-Size-Fits-All Indexing
- [ ] Avoid: Prototype Leakage
- [ ] Avoid: Memory-Naive Planning

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
- 1 | Production IVFFlat Without HNSW Evaluation | Performance
- 2 | Default ef_search Without Workload Tuning | Performance
- 3 | Index Degradation Without Rebuild Strategy | Reliability
- 4 | Same Index Type for All Workloads | Architecture
- 5 | Ignoring Benchmark Step Before Index Choice | Testing
- Static Index Mindset
- One-Size-Fits-All Indexing
- Prototype Leakage
- Memory-Naive Planning

## Related Knowledge
- K041 (pgvector extension)
- K043 (pgvector distance functions)
- K046 (pgvector iterative index scans)
- K047 (pgvector binary quantization)



