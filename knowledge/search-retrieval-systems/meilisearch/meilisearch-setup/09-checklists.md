# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 03-meilisearch
**Knowledge Unit:** Meilisearch Setup
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Meilisearch Setup implementation follows 03-meilisearch patterns
- [ ] All edge cases handled for Meilisearch Setup
- [ ] Full test coverage for Meilisearch Setup
- [ ] Security review completed for Meilisearch Setup
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Meilisearch Setup

---

# Architecture Checklist

- [ ] Deploy via Docker: docker run -it -p 7700:7700 getmeili/meilisearch
- [ ] Configure environment variables: MEILI_MASTER_KEY, MEILI_ENV, MEILI_HTTP_ADDR
- [ ] Single-node for most deployments; cloud for multi-region
- [ ] Separate Meilisearch instances per environment (dev/staging/prod)
- [ ] Evaluate: Meilisearch vs Alternative Search Engines
- [ ] Evaluate: Meilisearch Configuration and Setup Strategy
- [ ] Evaluate: Scout Driver Integration with Meilisearch

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Meilisearch Setup following 03-meilisearch patterns
- [ ] Configure all required settings for Meilisearch Setup
- [ ] Register route/middleware/service for Meilisearch Setup
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Sub-50ms query latency on typical SaaS datasets (<10M documents)
- [ ] LMDB storage allows datasets larger than RAM, but performance degrades when index exceeds available memory
- [ ] Embedding indexing is 7x faster since v1.38 (March 2026)
- [ ] 10-term limit per search query — complex queries may be truncated
- [ ] Index build time increases with document complexity and filterable attribute count

---

# Security Checklist

- [ ] **Never run without authentication in production**: Anyone can access the search API
- [ ] Use search-only API keys for frontend queries (not master key)
- [ ] Master key provides full admin access — keep it in server-side env vars
- [ ] Meilisearch does not encrypt data at rest by default; use encrypted volumes

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Can start a Meilisearch instance via Docker
- [ ] Can connect Scout to Meilisearch via config
- [ ] Can add Searchable trait to a model
- [ ] Can run scout:import and verify indexed documents
- [ ] Can perform search queries and see results
- [ ] Can verify filterable/sortable attributes work
- [ ] Write feature tests for happy path of Meilisearch Setup
- [ ] Write feature tests for validation failure of Meilisearch Setup
- [ ] Write feature tests for authentication failure of Meilisearch Setup
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
- Meilisearch vs Alternative Search Engines
- Meilisearch Configuration and Setup Strategy
- Scout Driver Integration with Meilisearch

## Related Knowledge
- K024 (Meilisearch filterable/sortable)
- K025 (Meilisearch typo tolerance)
- K027 (Meilisearch faceted search)
- K028 (Meilisearch hybrid search)
- K030 (Meilisearch ranking rules)



