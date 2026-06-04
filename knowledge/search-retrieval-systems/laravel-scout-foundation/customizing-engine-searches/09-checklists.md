# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 01-laravel-scout-foundation
**Knowledge Unit:** Customizing Engine Searches
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Customizing Engine Searches implementation follows 01-laravel-scout-foundation patterns
- [ ] All edge cases handled for Customizing Engine Searches
- [ ] Full test coverage for Customizing Engine Searches
- [ ] Security review completed for Customizing Engine Searches
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Customizing Engine Searches

---

# Architecture Checklist

- [ ] Keep engine-specific logic in dedicated service classes, not controllers.
- [ ] Use the callback closure to pass parameters: `Product::search($q)->query(fn($meilisearch, $query) => $meilisearch->setFilter('price > 10'))`.
- [ ] For complex queries, create a SearchService or QueryBuilder class that wraps Scout calls.
- [ ] Filter- or sort-only customizations can use `options()` with key-value arrays.
- [ ] Evaluate: Searchable Trait Implementation Strategy
- [ ] Evaluate: Indexing Strategy Selection
- [ ] Evaluate: Queue vs Synchronous Indexing Mode

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Customizing Engine Searches following 01-laravel-scout-foundation patterns
- [ ] Configure all required settings for Customizing Engine Searches
- [ ] Register route/middleware/service for Customizing Engine Searches
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Engine-specific callbacks add negligible overhead â€” they transform the request before sending.
- [ ] Complex filters or aggregations may increase search backend processing time.
- [ ] Callback parameters are not cached â€” they're applied on every search.

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

- [ ] Engine-specific callbacks work for your backend
- [ ] Engine-specific code does not break when switching engines
- [ ] SearchService or equivalent abstraction in place
- [ ] Callbacks tested with engine's full feature set
- [ ] Write feature tests for happy path of Customizing Engine Searches
- [ ] Write feature tests for validation failure of Customizing Engine Searches
- [ ] Write feature tests for authentication failure of Customizing Engine Searches
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
- Use Callback API for Per-Query Engine Customization
- Abstract Engine-Specific Callbacks Behind Service Classes
- Wrap Engine-Specific Code in Conditional Checks

### Decisions
- Searchable Trait Implementation Strategy
- Indexing Strategy Selection
- Queue vs Synchronous Indexing Mode

## Related Knowledge
- K001 (Searchable trait)
- K014 (Custom engine development)
- K018 (Algolia driver setup)
- K023 (Meilisearch driver setup)
- K033 (Typesense driver setup)



