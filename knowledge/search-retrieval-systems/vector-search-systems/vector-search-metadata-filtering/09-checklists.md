# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Vector Search Metadata Filtering
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Vector Search Metadata Filtering implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Vector Search Metadata Filtering
- [ ] Full test coverage for Vector Search Metadata Filtering
- [ ] Security review completed for Vector Search Metadata Filtering
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Vector Search Metadata Filtering
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
- [ ] Implement Vector Search Metadata Filtering following 06-vector-search-systems patterns
- [ ] Configure all required settings for Vector Search Metadata Filtering
- [ ] Register route/middleware/service for Vector Search Metadata Filtering
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

- [ ] Filter strategy chosen (pre/post)
- [ ] Filtered ANN queries working
- [ ] Index on filter fields
- [ ] Iterative search implemented
- [ ] Empty results from filters handled
- [ ] Selectivity monitored
- [ ] Write feature tests for happy path of Vector Search Metadata Filtering
- [ ] Write feature tests for validation failure of Vector Search Metadata Filtering
- [ ] Write feature tests for authentication failure of Vector Search Metadata Filtering
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

- [ ] Avoid: 1 | Post-Filtering (Vector Search Then PHP Filter) | Performance
- [ ] Avoid: 2 | No Index on Filterable Metadata Fields | Performance
- [ ] Avoid: 3 | No Iterative Search for Strict Filters | Reliability
- [ ] Avoid: 4 | Ignoring Filtered ANN Support | Performance
- [ ] Avoid: Post-Filter Habit
- [ ] Avoid: Unindexed Filters
- [ ] Avoid: Hard-Filter-No-Fallback

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
- 1 | Post-Filtering (Vector Search Then PHP Filter) | Performance
- 2 | No Index on Filterable Metadata Fields | Performance
- 3 | No Iterative Search for Strict Filters | Reliability
- 4 | Ignoring Filtered ANN Support | Performance
- Post-Filter Habit
- Unindexed Filters
- Hard-Filter-No-Fallback

## Related Knowledge
- K050 (Qdrant payload filtering)
- K058 (Pinecone metadata filtering)
- K046 (pgvector iterative scans)



