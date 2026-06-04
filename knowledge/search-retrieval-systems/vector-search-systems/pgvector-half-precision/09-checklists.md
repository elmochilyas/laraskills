# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Pgvector Half Precision
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pgvector Half Precision implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Pgvector Half Precision
- [ ] Full test coverage for Pgvector Half Precision
- [ ] Security review completed for Pgvector Half Precision
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pgvector Half Precision
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Define column type per use case: `halfvec(1536)`, `bit(256)`, or `sparsevec(10000)`.
- [ ] Index different types with appropriate index operator classes.
- [ ] Use `vector_dims()` to inspect vector dimensions regardless of type.
- [ ] Cast between types if needed: `my_embedding::vector` or `my_embedding::halfvec(1536)`.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Pgvector Half Precision following 06-vector-search-systems patterns
- [ ] Configure all required settings for Pgvector Half Precision
- [ ] Register route/middleware/service for Pgvector Half Precision
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] halfvec: 50% less memory, ~20% faster scans, <1% recall loss typically.
- [ ] bit: 32x less memory, supports Hamming distance (very fast).
- [ ] sparsevec: Efficient for high-dimensional sparse data, good for keyword matching.
- [ ] Index on compressed vectors is smaller and faster to search.

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

- [ ] Vector type selected (halfvec/bit/sparsevec) based on requirements
- [ ] Storage savings measured vs float32 baseline
- [ ] Accuracy loss benchmarked for selected type
- [ ] Re-ranking strategy implemented if using compressed vectors
- [ ] Index created with correct operator class for vector type
- [ ] Write feature tests for happy path of Pgvector Half Precision
- [ ] Write feature tests for validation failure of Pgvector Half Precision
- [ ] Write feature tests for authentication failure of Pgvector Half Precision
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

- [ ] Avoid: 1 | Deploying Reduced-Precision Without Accuracy Benchmark | Testing
- [ ] Avoid: 2 | Jumping to Binary Without halfvec Evaluation | Architecture
- [ ] Avoid: 3 | Direct Reduced-Precision Results Without Re-ranking | Performance
- [ ] Avoid: 4 | Mismatched Distance Function for Vector Type | Design
- [ ] Avoid: 5 | Using Float32 for Large Datasets Without Optimization | Scalability
- [ ] Avoid: Maximum Precision Fallacy
- [ ] Avoid: Quantization-by-Habit
- [ ] Avoid: Storage Blindness
- [ ] Avoid: Type-Mismatch Queries

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
- 1 | Deploying Reduced-Precision Without Accuracy Benchmark | Testing
- 2 | Jumping to Binary Without halfvec Evaluation | Architecture
- 3 | Direct Reduced-Precision Results Without Re-ranking | Performance
- 4 | Mismatched Distance Function for Vector Type | Design
- 5 | Using Float32 for Large Datasets Without Optimization | Scalability
- Maximum Precision Fallacy
- Quantization-by-Habit
- Storage Blindness
- Type-Mismatch Queries

## Related Knowledge
- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K043 (pgvector distance functions)
- K047 (pgvector binary quantization + re-ranking)



