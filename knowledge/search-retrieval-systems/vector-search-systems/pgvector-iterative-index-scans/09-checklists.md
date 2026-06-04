# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Pgvector Iterative Index Scans
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pgvector Iterative Index Scans implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Pgvector Iterative Index Scans
- [ ] Full test coverage for Pgvector Iterative Index Scans
- [ ] Security review completed for Pgvector Iterative Index Scans
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pgvector Iterative Index Scans
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `SET hnsw.iterative_scan = relaxed` or `strict` at the session or query level.
- [ ] `strict` (default): Return exact distances, may return fewer results.
- [ ] `relaxed`: Return more results matching the filter, distances may be approximate.
- [ ] Also configurable per-query: `ORDER BY ... <-> ... LIMIT ...` with explicit scan mode.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Pgvector Iterative Index Scans following 06-vector-search-systems patterns
- [ ] Configure all required settings for Pgvector Iterative Index Scans
- [ ] Register route/middleware/service for Pgvector Iterative Index Scans
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Iterative scans add 20-100ms latency compared to unfiltered ANN.
- [ ] Each iteration increases recall but adds ~5-10ms.
- [ ] The iteration limit prevents unbounded query times.
- [ ] With optimal parameters, recall can exceed 95% even with restrictive filters.

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

- [ ] Iterative scan mode configured (strict or relaxed)
- [ ] Filtered ANN recall measured against exact search
- [ ] Iteration limits set
- [ ] Query performance benchmarked with filters
- [ ] Write feature tests for happy path of Pgvector Iterative Index Scans
- [ ] Write feature tests for validation failure of Pgvector Iterative Index Scans
- [ ] Write feature tests for authentication failure of Pgvector Iterative Index Scans
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

- [ ] Avoid: 1 | Unfiltered ANN Without Iterative Scans Consideration | Performance
- [ ] Avoid: 2 | Relaxed Mode Without Tradeoff Awareness | Design
- [ ] Avoid: 3 | No Iteration Limit for Runaway Queries | Reliability
- [ ] Avoid: 4 | Iterative Scans on IVFFlat Indexes | Performance
- [ ] Avoid: 5 | No Filtered ANN Recall Monitoring | Testing
- [ ] Avoid: Filtered ANN Naivety
- [ ] Avoid: Set-and-Forget Scan Mode
- [ ] Avoid: Recall Blindness

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
- 1 | Unfiltered ANN Without Iterative Scans Consideration | Performance
- 2 | Relaxed Mode Without Tradeoff Awareness | Design
- 3 | No Iteration Limit for Runaway Queries | Reliability
- 4 | Iterative Scans on IVFFlat Indexes | Performance
- 5 | No Filtered ANN Recall Monitoring | Testing
- Filtered ANN Naivety
- Set-and-Forget Scan Mode
- Recall Blindness

## Related Knowledge
- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K050 (Qdrant payload filtering)
- K058 (Pinecone metadata filtering)



