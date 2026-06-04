# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Typesense Vector Search
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Typesense Vector Search implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Typesense Vector Search
- [ ] Full test coverage for Typesense Vector Search
- [ ] Security review completed for Typesense Vector Search
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Typesense Vector Search
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Include a `float[]` field in the collection schema for vectors.
- [ ] Generate embeddings externally (OpenAI, Cohere, FastEmbed) and include in `toSearchableArray()`.
- [ ] Use Typesense's `vector_query` parameter via Scout's callback API for hybrid queries.
- [ ] Vector search works within the same Typesense cluster â€” no additional infrastructure needed.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Typesense Vector Search following 06-vector-search-systems patterns
- [ ] Configure all required settings for Typesense Vector Search
- [ ] Register route/middleware/service for Typesense Vector Search
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] HNSW provides sub-100ms search for millions of vectors.
- [ ] Index build time increases with vector dimensions and dataset size.
- [ ] Vector search performance is memory-bound â€” ensure adequate RAM.
- [ ] Combining text and vector search in one query adds minimal overhead.

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

- [ ] Embedding field defined in collection schema
- [ ] Embedding generation pipeline implemented
- [ ] Vector queries return semantically relevant results
- [ ] Distance metric matches embedding model
- [ ] HNSW index configured for dataset size
- [ ] Write feature tests for happy path of Typesense Vector Search
- [ ] Write feature tests for validation failure of Typesense Vector Search
- [ ] Write feature tests for authentication failure of Typesense Vector Search
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

- [ ] Avoid: 1 | Mismatched Distance Metric for Embedding Model | Design
- [ ] Avoid: 2 | No vector_query Weight Configuration | Performance
- [ ] Avoid: 3 | Expecting Auto-Embeddings from Typesense | Architecture
- [ ] Avoid: 4 | No num_vectors Configuration | Performance
- [ ] Avoid: Auto-Embedding Assumption
- [ ] Avoid: Default Weight Blindness
- [ ] Avoid: Copy-Paste Metric

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
- 1 | Mismatched Distance Metric for Embedding Model | Design
- 2 | No vector_query Weight Configuration | Performance
- 3 | Expecting Auto-Embeddings from Typesense | Architecture
- 4 | No num_vectors Configuration | Performance
- Auto-Embedding Assumption
- Default Weight Blindness
- Copy-Paste Metric

## Related Knowledge
- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K035 (Typesense dynamic search parameters)
- K028 (Meilisearch hybrid search)



