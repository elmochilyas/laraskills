# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Qdrant Vector Search
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Qdrant Vector Search implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Qdrant Vector Search
- [ ] Full test coverage for Qdrant Vector Search
- [ ] Security review completed for Qdrant Vector Search
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Qdrant Vector Search
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Qdrant runs as a separate service â€” Docker for dev, dedicated server or cloud for prod.
- [ ] Integrate via REST API or community `qdrant-php` SDK.
- [ ] Create collections with appropriate vector size and distance metric.
- [ ] Use payload for metadata that needs filtering (not for large text content).
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Qdrant Vector Search following 06-vector-search-systems patterns
- [ ] Configure all required settings for Qdrant Vector Search
- [ ] Register route/middleware/service for Qdrant Vector Search
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Sub-10ms query latency for millions of vectors.
- [ ] HNSW with default parameters provides 95-99% recall.
- [ ] Memory-mapped storage allows datasets larger than RAM (with performance tradeoff).
- [ ] Quantization reduces memory by 4-8x with minimal recall loss.

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

- [ ] Qdrant server running (Docker/cloud)
- [ ] Collections created with correct vector size and metric
- [ ] Vector search returns semantically relevant results
- [ ] Payload filtering works alongside vector search
- [ ] HNSW parameters tuned for dataset
- [ ] Quantization enabled for large datasets
- [ ] Write feature tests for happy path of Qdrant Vector Search
- [ ] Write feature tests for validation failure of Qdrant Vector Search
- [ ] Write feature tests for authentication failure of Qdrant Vector Search
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

- [ ] Avoid: 1 | Default HNSW Parameters Without Tuning | Performance
- [ ] Avoid: 2 | Post-Filtering Instead of Payload Filtering | Performance
- [ ] Avoid: 3 | No Quantization for Large Datasets | Scalability
- [ ] Avoid: 4 | Large Payloads Stored with Vectors | Performance
- [ ] Avoid: Qdrant-as-Content-Store
- [ ] Avoid: Post-Filter Habit
- [ ] Avoid: Tuning-Free Operations

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
- 1 | Default HNSW Parameters Without Tuning | Performance
- 2 | Post-Filtering Instead of Payload Filtering | Performance
- 3 | No Quantization for Large Datasets | Scalability
- 4 | Large Payloads Stored with Vectors | Performance
- Qdrant-as-Content-Store
- Post-Filter Habit
- Tuning-Free Operations

## Related Knowledge
- K049 (Qdrant hybrid queries)
- K050 (Qdrant payload filtering)
- K051 (Qdrant quantization)
- K052 (Qdrant multitenancy)
- K053 (Qdrant FastEmbed)
- K054 (Qdrant cross-encoder re-ranking)
- K055 (Qdrant Edge)



