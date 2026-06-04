# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Pgvector Binary Quantization
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pgvector Binary Quantization implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Pgvector Binary Quantization
- [ ] Full test coverage for Pgvector Binary Quantization
- [ ] Security review completed for Pgvector Binary Quantization
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pgvector Binary Quantization
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Convert to binary: `SELECT binary_quantize(embedding) FROM items;`
- [ ] Create HNSW index on binary column.
- [ ] Original float32 vectors stored in separate column (or same table).
- [ ] Query: binary ANN search â†’ get candidate IDs â†’ re-rank with original float32.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Pgvector Binary Quantization following 06-vector-search-systems patterns
- [ ] Configure all required settings for Pgvector Binary Quantization
- [ ] Register route/middleware/service for Pgvector Binary Quantization
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Binary HNSW index: 32x smaller, faster to search.
- [ ] Re-ranking adds overhead: 10-50ms for top-100 candidates.
- [ ] Total query time: binary ANN (1-2ms) + re-rank (10-50ms) = similar to float32 HNSW.
- [ ] Memory savings are significant: 10M vectors @ 1536-dim = ~60GB float32 vs ~2GB binary.

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

- [ ] Binary quantized column created
- [ ] HNSW index on binary vectors built
- [ ] Re-ranking with original float32 implemented
- [ ] Effective recall measured vs float32 baseline
- [ ] Memory savings confirmed
- [ ] Write feature tests for happy path of Pgvector Binary Quantization
- [ ] Write feature tests for validation failure of Pgvector Binary Quantization
- [ ] Write feature tests for authentication failure of Pgvector Binary Quantization
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

- [ ] Avoid: 1 | Binary-Only Search Without Re-ranking | Performance
- [ ] Avoid: 2 | Applying Binary Quantization Without Model Suitability Test | Testing
- [ ] Avoid: 3 | Skipping halfvec Evaluation Before Binary | Architecture
- [ ] Avoid: 4 | Default Binary Query Parameters Without Tuning | Performance
- [ ] Avoid: 5 | Binary Quantization for Small Datasets | Architecture
- [ ] Avoid: Compression-First Mentality
- [ ] Avoid: Quantize-Once Assumption
- [ ] Avoid: Recall Slippage

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
- 1 | Binary-Only Search Without Re-ranking | Performance
- 2 | Applying Binary Quantization Without Model Suitability Test | Testing
- 3 | Skipping halfvec Evaluation Before Binary | Architecture
- 4 | Default Binary Query Parameters Without Tuning | Performance
- 5 | Binary Quantization for Small Datasets | Architecture
- Compression-First Mentality
- Quantize-Once Assumption
- Recall Slippage

## Related Knowledge
- K041 (pgvector extension)
- K042 (pgvector HNSW / IVFFlat indexing)
- K044 (pgvector half-precision)
- K051 (Qdrant quantization)



