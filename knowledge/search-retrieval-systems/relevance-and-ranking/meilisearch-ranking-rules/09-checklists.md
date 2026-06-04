# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 08-relevance-and-ranking
**Knowledge Unit:** Meilisearch Ranking Rules
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Meilisearch Ranking Rules implementation follows 08-relevance-and-ranking patterns
- [ ] All edge cases handled for Meilisearch Ranking Rules
- [ ] Full test coverage for Meilisearch Ranking Rules
- [ ] Security review completed for Meilisearch Ranking Rules
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Meilisearch Ranking Rules
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Configure in Meilisearch index settings via dashboard, API, or Scout config.
- [ ] Default order: `["words", "typo", "proximity", "attribute", "sort", "exactness"]`.
- [ ] Custom rules appended: `["words", "typo", "proximity", "attribute", "sort", "exactness", "popularity:desc"]`.
- [ ] Rule order changes require re-indexing.
- [ ] Evaluate: Relevance Tuning Strategy
- [ ] Evaluate: BM25 vs Vector Similarity for Relevance
- [ ] Evaluate: Cross-Encoder Reranking Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Meilisearch Ranking Rules following 08-relevance-and-ranking patterns
- [ ] Configure all required settings for Meilisearch Ranking Rules
- [ ] Register route/middleware/service for Meilisearch Ranking Rules
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Ranking rules are applied at query time â€” no index impact.
- [ ] More rules = more computation, but overhead is negligible.
- [ ] Custom ranking on numeric attributes adds minimal overhead.
- [ ] Removing unused rules slightly improves query performance.

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

- [ ] Default ranking rule order understood
- [ ] Custom ranking rules added if needed
- [ ] Rule order optimized for content type
- [ ] Relevance tested with representative queries
- [ ] Write feature tests for happy path of Meilisearch Ranking Rules
- [ ] Write feature tests for validation failure of Meilisearch Ranking Rules
- [ ] Write feature tests for authentication failure of Meilisearch Ranking Rules
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

- [ ] Avoid: Reordering Default Ranking Rules
- [ ] Avoid: Custom Ranking Before Default Rules
- [ ] Avoid: Deploying Rule Changes Without Testing
- [ ] Avoid: Removing Default Rules Without Justification
- [ ] Avoid: Ignoring Rule Interaction Effects

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
- Reordering Default Ranking Rules
- Custom Ranking Before Default Rules
- Deploying Rule Changes Without Testing
- Removing Default Rules Without Justification
- Ignoring Rule Interaction Effects

## Related Knowledge
- K031 (Meilisearch custom ranking)
- K024 (Meilisearch filterable/sortable attributes)
- K025 (Meilisearch typo tolerance)
- K066 (Faceted search implementation)



