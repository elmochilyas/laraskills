# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** REST Purity vs Pragmatic
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] REST Purity vs Pragmatic implementation follows rest-api-design patterns
- [ ] All edge cases handled for REST Purity vs Pragmatic
- [ ] Full test coverage for REST Purity vs Pragmatic
- [ ] Security review completed for REST Purity vs Pragmatic
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for REST Purity vs Pragmatic
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use the "REST-first with documented exceptions" default. This sets a baseline expectation while allowing necessary deviations.
- [ ] Establish an API style guide specifying which constraints are mandatory vs recommended, the process for requesting a deviation, and review cadence.
- [ ] Consider different standards for external vs internal APIs. Public APIs benefit from higher purity; internal APIs can be more pragmatic.
- [ ] Use `Route::apiResource()` for REST defaults. Add action endpoints as explicit POST routes with documentation comments explaining the deviation.
- [ ] Track deviations in code reviews â€” each deviation should be explicitly discussed and justified.

---

# Implementation Checklist

- [ ] Every REST purity tradeoff is documented with rationale
- [ ] Core REST principles (resources, HTTP methods, status codes) are preserved even when deviating
- [ ] HATEOAS omission is a deliberate choice, not an oversight
- [ ] Custom response formats are consistent and documented
- [ ] Performance-driven deviations (data embedding, caching) are measured and justified
- [ ] Deviations are revisited when the API undergoes major version changes
- [ ] Clients are not negatively impacted by deviations (documented for them)
- [ ] The team agrees on the tradeoff boundaries
- [ ] Implement REST Purity vs Pragmatic following rest-api-design patterns
- [ ] Configure all required settings for REST Purity vs Pragmatic
- [ ] Register route/middleware/service for REST Purity vs Pragmatic
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Full HATEOAS adds 10-30% to response payload size â€” pragmatic omission saves bandwidth.
- [ ] POST for search avoids URL length limits (~2KB-8KB) enabling complex queries that GET cannot support.
- [ ] Stripping content negotiation processing from middleware saves 1-3ms per request.
- [ ] Pragmatic APIs with fewer constraints have simpler middleware stacks â€” fewer format checks, simpler routing.

---

# Security Checklist

- [ ] Deviations must not weaken security â€” `POST /search` is fine, but `GET /delete-user?id=42` is not.
- [ ] Action endpoints with complex side effects need stricter authorization review â€” the non-standard pattern may hide impact.
- [ ] JSON-only APIs reduce attack surface compared to multi-format APIs (no XML parser vulnerabilities).
- [ ] Documented deviations are auditable â€” undocumented deviations create security blind spots.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] REST conventions are the default for all endpoints.
- [ ] Each pragmatic deviation is documented with justification.
- [ ] Deviations are consistent across the API â€” same pattern for similar cases.
- [ ] The API style guide specifies which constraints are mandatory vs recommended.
- [ ] Deviations are reviewed periodically and removed when no longer justified.
- [ ] Internal and external APIs may have different purity standards, but each is consistent within itself.
- [ ] The API is described as "RESTful" (Level 2) or "REST" (Level 3) accurately, not deceptively.
- [ ] Write feature tests for happy path of REST Purity vs Pragmatic
- [ ] Write feature tests for validation failure of REST Purity vs Pragmatic
- [ ] Write feature tests for authentication failure of REST Purity vs Pragmatic
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

- [ ] Avoid: Dogmatic Purity at All Costs
- [ ] Avoid: Unprincipled Pragmatism
- [ ] Avoid: False Dichotomy Debates
- [ ] Avoid: Rigid Style Guide
- [ ] Avoid: Security Through Purity

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
- Default To REST, Deviate With Documentation
- Be Consistent Over Pure
- Use The Deviation Decision Matrix
- Codify Common Deviations In The Style Guide
- Accept That Some Operations Are Actions
- Review Deviations Quarterly
- Set Different Purity Standards For External vs Internal APIs

### Anti-Patterns
- Dogmatic Purity at All Costs
- Unprincipled Pragmatism
- False Dichotomy Debates
- Rigid Style Guide
- Security Through Purity

## Related Knowledge
- Prerequisites
- Related
- Advanced



