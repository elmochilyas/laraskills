# Metadata
**Domain:** Search & Retrieval Systems
**Subdomain:** 05-typesense
**Knowledge Unit:** Typesense Collection Schemas
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Typesense Collection Schemas implementation follows 05-typesense patterns
- [ ] All edge cases handled for Typesense Collection Schemas
- [ ] Full test coverage for Typesense Collection Schemas
- [ ] Security review completed for Typesense Collection Schemas
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Typesense Collection Schemas

---

# Architecture Checklist

- [ ] Configure per-model in `config/scout.php` under `typesense.model-settings`.
- [ ] Each model gets its own collection named after `searchableAs()`.
- [ ] Schema is applied when Scout first detects a new collection name.
- [ ] For schema changes: deploy code change â†’ re-run import â†’ flush old collection.
- [ ] Evaluate: Typesense vs Alternative Search Engines
- [ ] Evaluate: Typesense Configuration and Setup Strategy
- [ ] Evaluate: Scout Driver Integration with Typesense

---

# Implementation Checklist

- [ ] Configuration verified and working in development environment
- [ ] All edge cases tested (empty results, errors, timeouts)
- [ ] Monitoring and alerting configured
- [ ] Documentation updated for operations team
- [ ] Implement Typesense Collection Schemas following 05-typesense patterns
- [ ] Configure all required settings for Typesense Collection Schemas
- [ ] Register route/middleware/service for Typesense Collection Schemas
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Schema definition has no direct performance impact â€” it's created once.
- [ ] Declaring `facet: true` on many fields increases index size slightly.
- [ ] `sort: true` on string fields adds some index overhead.
- [ ] Schema validation happens at index time, not query time.

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

- [ ] Collection schemas defined for each Searchable model
- [ ] Facetable fields declared with facet: true
- [ ] Sortable fields declared with sort: true
- [ ] Schema re-indexing process documented
- [ ] No auto types in production
- [ ] Write feature tests for happy path of Typesense Collection Schemas
- [ ] Write feature tests for validation failure of Typesense Collection Schemas
- [ ] Write feature tests for authentication failure of Typesense Collection Schemas
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
- Typesense vs Alternative Search Engines
- Typesense Configuration and Setup Strategy
- Scout Driver Integration with Typesense

## Related Knowledge
- K033 (Typesense driver setup)
- K035 (Typesense dynamic search parameters)
- K038 (Typesense faceting)



