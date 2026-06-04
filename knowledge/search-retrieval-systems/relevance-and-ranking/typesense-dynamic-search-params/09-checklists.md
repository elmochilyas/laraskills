# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 08-relevance-and-ranking
**Knowledge Unit:** Typesense Dynamic Search Params
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Typesense Dynamic Search Params implementation follows 08-relevance-and-ranking patterns
- [ ] All edge cases handled for Typesense Dynamic Search Params
- [ ] Full test coverage for Typesense Dynamic Search Params
- [ ] Security review completed for Typesense Dynamic Search Params
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Typesense Dynamic Search Params

---

# Architecture Checklist

- [ ] Use Scout's callback API to pass Typesense-specific parameters per query.
- [ ] Define default parameters in a service class and override per-query as needed.
- [ ] Parameters are passed via `$builder->query(function ($typesense, $query) { ... })`.
- [ ] Schema-level defaults can be set in the collection schema in scout.php.
- [ ] Evaluate: Relevance Tuning Strategy
- [ ] Evaluate: BM25 vs Vector Similarity for Relevance
- [ ] Evaluate: Cross-Encoder Reranking Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Typesense Dynamic Search Params following 08-relevance-and-ranking patterns
- [ ] Configure all required settings for Typesense Dynamic Search Params
- [ ] Register route/middleware/service for Typesense Dynamic Search Params
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Larger `max_candidates` improves recall but increases query latency.
- [ ] Higher `num_typos` increases search space and latency slightly.
- [ ] Prefix search on many fields adds overhead.
- [ ] Parameter tuning has a direct impact on query performance.

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

- [ ] query_by configured with correct field priority
- [ ] query_by_weights set for field importance
- [ ] num_typos tuned per field type
- [ ] max_candidates optimized for recall/latency balance
- [ ] Parameters abstracted through Scout callback API
- [ ] Write feature tests for happy path of Typesense Dynamic Search Params
- [ ] Write feature tests for validation failure of Typesense Dynamic Search Params
- [ ] Write feature tests for authentication failure of Typesense Dynamic Search Params
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

- [ ] Avoid tight coupling between layers
- [ ] Avoid business logic in controllers
- [ ] Avoid skipping validation layers

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
- Relevance Tuning Strategy
- BM25 vs Vector Similarity for Relevance
- Cross-Encoder Reranking Strategy

## Related Knowledge
- K033 (Typesense driver setup)
- K034 (Typesense collection schemas)
- K040 (Typesense typo tolerance)
- K013 (Customizing engine searches)



