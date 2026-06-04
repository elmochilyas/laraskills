# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 08-relevance-and-ranking
**Knowledge Unit:** Algolia Index Settings
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Algolia Index Settings implementation follows 08-relevance-and-ranking patterns
- [ ] All edge cases handled for Algolia Index Settings
- [ ] Full test coverage for Algolia Index Settings
- [ ] Security review completed for Algolia Index Settings
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Algolia Index Settings
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Configure per-index under `algolia.index-settings` in `config/scout.php`.
- [ ] Each Searchable model maps to its own index with its own settings.
- [ ] Settings are applied when Scout first detects a new index (during import).
- [ ] For existing indexes, settings updates require re-importing data.
- [ ] Evaluate: Relevance Tuning Strategy
- [ ] Evaluate: BM25 vs Vector Similarity for Relevance
- [ ] Evaluate: Cross-Encoder Reranking Strategy

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Algolia Index Settings following 08-relevance-and-ranking patterns
- [ ] Configure all required settings for Algolia Index Settings
- [ ] Register route/middleware/service for Algolia Index Settings
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `searchableAttributes` order directly impacts search quality â€” cheaper attributes first.
- [ ] Too many `attributesForFaceting` increases index size.
- [ ] Each replica index consumes additional Algolia resources (pricing impact).
- [ ] Settings changes do not affect query performance â€” only index structure.

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

- [ ] searchableAttributes configured with correct priority order
- [ ] attributesForFaceting includes all filterable fields
- [ ] customRanking configured for business signals
- [ ] Replica indexes created for different sort orders
- [ ] Settings applied during deployment pipeline
- [ ] Write feature tests for happy path of Algolia Index Settings
- [ ] Write feature tests for validation failure of Algolia Index Settings
- [ ] Write feature tests for authentication failure of Algolia Index Settings
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

- [ ] Avoid: Managing Index Settings via Dashboard Only
- [ ] Avoid: Misordered searchableAttributes
- [ ] Avoid: Missing attributesForFaceting Declaration
- [ ] Avoid: Sorting Without Replica Indexes
- [ ] Avoid: Settings Changes Without Re-Importing

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
- Managing Index Settings via Dashboard Only
- Misordered searchableAttributes
- Missing attributesForFaceting Declaration
- Sorting Without Replica Indexes
- Settings Changes Without Re-Importing

## Related Knowledge
- K018 (Algolia driver setup)
- K022 (Algolia A/B testing)
- K020 (Algolia analytics)
- K021 (Algolia geo-search)



