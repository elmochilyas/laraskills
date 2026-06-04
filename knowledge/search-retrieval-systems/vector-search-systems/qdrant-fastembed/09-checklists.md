# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 06-vector-search-systems
**Knowledge Unit:** Qdrant Fastembed
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Qdrant Fastembed implementation follows 06-vector-search-systems patterns
- [ ] All edge cases handled for Qdrant Fastembed
- [ ] Full test coverage for Qdrant Fastembed
- [ ] Security review completed for Qdrant Fastembed
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Qdrant Fastembed
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] FastEmbed runs as a separate Python service (Docker container) accessible via HTTP from Laravel.
- [ ] Laravel sends text to the FastEmbed service, receives embedding vectors, and stores them in Qdrant.
- [ ] For batch indexing, Laravel sends document batches to the FastEmbed service.
- [ ] Cache embeddings in Redis/PostgreSQL to avoid redundant inference.
- [ ] Evaluate: Vector Database Selection Strategy
- [ ] Evaluate: Embedding Generation Approach
- [ ] Evaluate: ANN Index Type Selection (HNSW vs IVFFlat)

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Qdrant Fastembed following 06-vector-search-systems patterns
- [ ] Configure all required settings for Qdrant Fastembed
- [ ] Register route/middleware/service for Qdrant Fastembed
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] On-device embedding latency: 5-50ms per text (varies by model size and hardware).
- [ ] GPU acceleration significantly improves throughput (10-50x vs CPU).
- [ ] Batch processing improves throughput: processing 32 texts at once is faster than 32 individual calls.
- [ ] Embedding cache hits are ~1ms (vs 5-50ms for inference).

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

- [ ] FastEmbed service running (Docker/sidecar)
- [ ] Embedding generation endpoint accessible from Laravel
- [ ] Embedding cache implemented
- [ ] Batch embedding processing configured
- [ ] Model selection documented (speed vs quality tradeoff)
- [ ] Write feature tests for happy path of Qdrant Fastembed
- [ ] Write feature tests for validation failure of Qdrant Fastembed
- [ ] Write feature tests for authentication failure of Qdrant Fastembed
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

- [ ] Avoid: 1 | shell_exec for FastEmbed Instead of HTTP Microservice | Reliability
- [ ] Avoid: 2 | Always Using Large Model Unnecessarily | Design
- [ ] Avoid: 3 | No Cache for FastEmbed Embeddings | Performance
- [ ] Avoid: 4 | Per-Document API Calls Instead of Batch Inference | Performance
- [ ] Avoid: Embedded Python
- [ ] Avoid: CPU-Bound Inference
- [ ] Avoid: No-Cache Pipeline

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
- 1 | shell_exec for FastEmbed Instead of HTTP Microservice | Reliability
- 2 | Always Using Large Model Unnecessarily | Design
- 3 | No Cache for FastEmbed Embeddings | Performance
- 4 | Per-Document API Calls Instead of Batch Inference | Performance
- Embedded Python
- CPU-Bound Inference
- No-Cache Pipeline

## Related Knowledge
- K048 (Qdrant vector search)
- K067 (Embedding generation strategies)
- K054 (Qdrant cross-encoder re-ranking)
- K055 (Qdrant Edge)



