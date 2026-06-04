# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Pgvector Distance Functions
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pgvector Distance Functions implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Pgvector Distance Functions
- [ ] Full test coverage for Pgvector Distance Functions
- [ ] Security review completed for Pgvector Distance Functions
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pgvector Distance Functions
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Index operator class must match the distance function: `vector_cosine_ops` for `<=>`, `vector_l2_ops` for `<->`, `vector_ip_ops` for `<#>`.
- [ ] Query using the corresponding operator: `ORDER BY embedding <=> $query_vec`.
- [ ] Bit type vectors use `bit_hamming_ops` or `bit_jaccard_ops`.
- [ ] For normalized embeddings, L2 and cosine have the same ordering â€” use L2 for faster computation.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Pgvector Distance Functions following 06-vector-search-systems patterns
- [ ] Configure all required settings for Pgvector Distance Functions
- [ ] Register route/middleware/service for Pgvector Distance Functions
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] L2 and cosine similar performance; inner product slightly faster.
- [ ] L1 distance is slower (absolute value computation).
- [ ] Hamming distance on `bit` vectors is very fast (hardware-optimized).
- [ ] Index operator class must match query operator for ANN search.

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

- [ ] Distance function matches embedding model's training metric
- [ ] Index created with matching operator class
- [ ] Query operator matches index operator class
- [ ] Distance results are semantically meaningful
- [ ] Alternative distance functions benchmarked
- [ ] Write feature tests for happy path of Pgvector Distance Functions
- [ ] Write feature tests for validation failure of Pgvector Distance Functions
- [ ] Write feature tests for authentication failure of Pgvector Distance Functions
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

- [ ] Avoid: 1 | Mismatched Distance Function for Embedding Model | Design
- [ ] Avoid: 2 | Mismatched Index Operator Class and Query Operator | Performance
- [ ] Avoid: 3 | L2 Default for Text Embeddings | Design
- [ ] Avoid: 4 | L2 on Normalized Vectors Without Performance Awareness | Performance
- [ ] Avoid: 5 | No Benchmarking of Alternative Distance Functions | Testing
- [ ] Avoid: Copy-Paste Operator Choice
- [ ] Avoid: Index-Query Operator Mismatch
- [ ] Avoid: Default Fallacy

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
- 1 | Mismatched Distance Function for Embedding Model | Design
- 2 | Mismatched Index Operator Class and Query Operator | Performance
- 3 | L2 Default for Text Embeddings | Design
- 4 | L2 on Normalized Vectors Without Performance Awareness | Performance
- 5 | No Benchmarking of Alternative Distance Functions | Testing
- Copy-Paste Operator Choice
- Index-Query Operator Mismatch
- Default Fallacy

## Related Knowledge
- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K044 (pgvector half-precision / binary / sparse)
- K070 (Laravel + pgvector via Eloquent)



