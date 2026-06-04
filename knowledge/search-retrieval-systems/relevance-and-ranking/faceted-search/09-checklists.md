# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 08-relevance-and-ranking
**Knowledge Unit:** Faceted Search
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Faceted Search implementation follows 08-relevance-and-ranking patterns
- [ ] All edge cases handled for Faceted Search
- [ ] Full test coverage for Faceted Search
- [ ] Security review completed for Faceted Search
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Faceted Search
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Evaluate: Relevance Tuning Strategy
- [ ] Evaluate: BM25 vs Vector Similarity for Relevance
- [ ] Evaluate: Cross-Encoder Reranking Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Faceted Search following 08-relevance-and-ranking patterns
- [ ] Configure all required settings for Faceted Search
- [ ] Register route/middleware/service for Faceted Search
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

- [ ] Facet attributes declared filterable
- [ ] Facet counts render in UI
- [ ] Multi-facet filtering works (AND/OR correctly)
- [ ] High-cardinality facets handled
- [ ] Facet selection refines results correctly
- [ ] Write feature tests for happy path of Faceted Search
- [ ] Write feature tests for validation failure of Faceted Search
- [ ] Write feature tests for authentication failure of Faceted Search
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

- [ ] Avoid: Undeclared Filterable Attributes
- [ ] Avoid: Showing Too Many Facet Values
- [ ] Avoid: Misordered Facets
- [ ] Avoid: Static Facet Counts Without Dynamic Updates
- [ ] Avoid: Over-Declaring High-Cardinality Facets

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

### Anti-Patterns
- Undeclared Filterable Attributes
- Showing Too Many Facet Values
- Misordered Facets
- Static Facet Counts Without Dynamic Updates
- Over-Declaring High-Cardinality Facets

## Related Knowledge
- K024 (Meilisearch filterable/sortable)
- K027 (Meilisearch faceted search)
- K038 (Typesense faceting)



