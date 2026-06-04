# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Vector Search Production
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Vector Search Production implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Vector Search Production
- [ ] Full test coverage for Vector Search Production
- [ ] Security review completed for Vector Search Production
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Vector Search Production
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
- [ ] Implement Vector Search Production following 06-vector-search-systems patterns
- [ ] Configure all required settings for Vector Search Production
- [ ] Register route/middleware/service for Vector Search Production
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

- [ ] HW sizing done (RAM, CPU)
- [ ] Index refresh strategy documented
- [ ] Monitoring for latency and recall
- [ ] Backup strategy (vectors + source)
- [ ] DR plan documented
- [ ] Scaling plan for growth
- [ ] Managed service selected if appropriate
- [ ] Production readiness checklist complete
- [ ] Write feature tests for happy path of Vector Search Production
- [ ] Write feature tests for validation failure of Vector Search Production
- [ ] Write feature tests for authentication failure of Vector Search Production
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

- [ ] Avoid: 1 | Self-Hosting Without Operational Capacity | Architecture
- [ ] Avoid: 2 | Under-Sized RAM for HNSW | Scalability
- [ ] Avoid: 3 | No Index Refresh Strategy | Reliability
- [ ] Avoid: 4 | Vector-Only Backups Without Source Data | Reliability
- [ ] Avoid: DIY Vector Infrastructure
- [ ] Avoid: HNSW Memory Blindness
- [ ] Avoid: Rebuild-Never Mindset
- [ ] Avoid: Vector Backup Without Source

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
- 1 | Self-Hosting Without Operational Capacity | Architecture
- 2 | Under-Sized RAM for HNSW | Scalability
- 3 | No Index Refresh Strategy | Reliability
- 4 | Vector-Only Backups Without Source Data | Reliability
- DIY Vector Infrastructure
- HNSW Memory Blindness
- Rebuild-Never Mindset
- Vector Backup Without Source

## Related Knowledge
- K013 (Vector search performance)
- K014 (Benchmarking)
- K042 (HNSW / IVFFlat)



