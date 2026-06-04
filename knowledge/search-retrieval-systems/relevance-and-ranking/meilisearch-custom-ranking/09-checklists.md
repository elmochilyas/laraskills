# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 08-relevance-and-ranking
**Knowledge Unit:** Meilisearch Custom Ranking
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Meilisearch Custom Ranking implementation follows 08-relevance-and-ranking patterns
- [ ] All edge cases handled for Meilisearch Custom Ranking
- [ ] Full test coverage for Meilisearch Custom Ranking
- [ ] Security review completed for Meilisearch Custom Ranking
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Meilisearch Custom Ranking
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Configure in Meilisearch index settings via the dashboard, API, or Scout config.
- [ ] Default ranking rule order: `["words", "typo", "proximity", "attribute", "sort", "exactness", "custom:popularity:desc"]`.
- [ ] Custom ranking is applied at query time â€” index structure unaffected.
- [ ] Multiple custom ranking rules can be combined.
- [ ] Evaluate: Relevance Tuning Strategy
- [ ] Evaluate: BM25 vs Vector Similarity for Relevance
- [ ] Evaluate: Cross-Encoder Reranking Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Meilisearch Custom Ranking following 08-relevance-and-ranking patterns
- [ ] Configure all required settings for Meilisearch Custom Ranking
- [ ] Register route/middleware/service for Meilisearch Custom Ranking
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

- [ ] Custom ranking rule configured (asc/desc on numeric attribute)
- [ ] Rule placed after default rules in ranking rule order
- [ ] Business relevance improved over default-only ranking
- [ ] Text relevance not excessively diluted
- [ ] Write feature tests for happy path of Meilisearch Custom Ranking
- [ ] Write feature tests for validation failure of Meilisearch Custom Ranking
- [ ] Write feature tests for authentication failure of Meilisearch Custom Ranking
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

- [ ] Avoid: Custom Ranking Before Default Rules
- [ ] Avoid: Custom Ranking on Non-Numeric Attributes
- [ ] Avoid: Overpowering Text Relevance with Business Signals
- [ ] Avoid: Custom Ranking Without Testing
- [ ] Avoid: Too Many Custom Ranking Rules

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
- Custom Ranking Before Default Rules
- Custom Ranking on Non-Numeric Attributes
- Overpowering Text Relevance with Business Signals
- Custom Ranking Without Testing
- Too Many Custom Ranking Rules

## Related Knowledge
- K030 (Meilisearch ranking rules)
- K024 (Meilisearch filterable/sortable attributes)
- K066 (Faceted search implementation)



