# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Vector Search Performance
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Vector Search Performance implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Vector Search Performance
- [ ] Full test coverage for Vector Search Performance
- [ ] Security review completed for Vector Search Performance
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Vector Search Performance
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
- [ ] Implement Vector Search Performance following 06-vector-search-systems patterns
- [ ] Configure all required settings for Vector Search Performance
- [ ] Register route/middleware/service for Vector Search Performance
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

- [ ] Index type and parameters chosen
- [ ] Recall vs latency benchmarked
- [ ] Memory usage profiled
- [ ] ef_search/probes tuned
- [ ] Quantization evaluated
- [ ] Dimensionality justified
- [ ] Write feature tests for happy path of Vector Search Performance
- [ ] Write feature tests for validation failure of Vector Search Performance
- [ ] Write feature tests for authentication failure of Vector Search Performance
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

- [ ] Avoid: 1 | Tuning Without Recall vs Latency Benchmarks | Performance
- [ ] Avoid: 2 | Default ef_search (Not Tuned) | Performance
- [ ] Avoid: 3 | No Quantization for Datasets Exceeding RAM | Scalability
- [ ] Avoid: 4 | Underestimating Memory for HNSW Overhead | Scalability
- [ ] Avoid: Guesswork Tuning
- [ ] Avoid: RAM Sizing naivety
- [ ] Avoid: Quantization Avoidance

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
- 1 | Tuning Without Recall vs Latency Benchmarks | Performance
- 2 | Default ef_search (Not Tuned) | Performance
- 3 | No Quantization for Datasets Exceeding RAM | Scalability
- 4 | Underestimating Memory for HNSW Overhead | Scalability
- Guesswork Tuning
- RAM Sizing naivety
- Quantization Avoidance

## Related Knowledge
- K042 (HNSW / IVFFlat)
- K047 (Binary quantization)
- K014 (Performance benchmarking)



