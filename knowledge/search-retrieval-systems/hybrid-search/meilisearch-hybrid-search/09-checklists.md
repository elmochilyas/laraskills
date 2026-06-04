# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 07-hybrid-search
**Knowledge Unit:** Meilisearch Hybrid Search
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Meilisearch Hybrid Search implementation follows 07-hybrid-search patterns
- [ ] All edge cases handled for Meilisearch Hybrid Search
- [ ] Full test coverage for Meilisearch Hybrid Search
- [ ] Security review completed for Meilisearch Hybrid Search
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Meilisearch Hybrid Search
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Configure embedder in Meilisearch server settings (not in Scout config).
- [ ] For Scout integration, use the callback API to pass hybrid parameters.
- [ ] Meilisearch handles embedding generation during indexing (adds indexing time).
- [ ] Hybrid queries still benefit from all Meilisearch features (filtering, faceting, sorting).
- [ ] Evaluate: Hybrid Search Fusion Strategy
- [ ] Evaluate: Keyword vs Vector Search Weight Allocation
- [ ] Evaluate: Built-in vs Custom Hybrid Implementation

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Meilisearch Hybrid Search following 07-hybrid-search patterns
- [ ] Configure all required settings for Meilisearch Hybrid Search
- [ ] Register route/middleware/service for Meilisearch Hybrid Search
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Auto-embedding during indexing adds processing time (varies by model and document count).
- [ ] Hybrid query latency = max(keyword_latency, vector_latency) + fusion overhead.
- [ ] Embedding generation can be CPU/GPU intensive for large indexes.
- [ ] Built-in embedding models run on the Meilisearch server, consuming its resources.

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

- [ ] Meilisearch hybrid search enabled
- [ ] Embedder configured (built-in or external)
- [ ] Hybrid queries return combined results
- [ ] semanticRatio tuned for content type
- [ ] Fusion balance monitored
- [ ] Write feature tests for happy path of Meilisearch Hybrid Search
- [ ] Write feature tests for validation failure of Meilisearch Hybrid Search
- [ ] Write feature tests for authentication failure of Meilisearch Hybrid Search
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

- [ ] Avoid: External Embeddings from Day One
- [ ] Avoid: One-Size-Fits-All SemanticRatio
- [ ] Avoid: Deploying Hybrid Without Keyword Baseline
- [ ] Avoid: Ignoring Indexing Time Impact of Auto-Embeddings
- [ ] Avoid: Using Meilisearch Hybrid for Fine-Grained Fusion Control

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
- Hybrid Search Fusion Strategy
- Keyword vs Vector Search Weight Allocation
- Built-in vs Custom Hybrid Implementation

### Anti-Patterns
- External Embeddings from Day One
- One-Size-Fits-All SemanticRatio
- Deploying Hybrid Without Keyword Baseline
- Ignoring Indexing Time Impact of Auto-Embeddings
- Using Meilisearch Hybrid for Fine-Grained Fusion Control

## Related Knowledge
- K023 (Meilisearch driver setup)
- K029 (Meilisearch RAG)
- K061 (RRF - Reciprocal Rank Fusion)
- K049 (Qdrant hybrid queries)



