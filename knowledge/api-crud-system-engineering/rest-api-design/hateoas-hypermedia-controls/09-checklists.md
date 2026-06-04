# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** HATEOAS / Hypermedia Controls
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] HATEOAS / Hypermedia Controls implementation follows rest-api-design patterns
- [ ] All edge cases handled for HATEOAS / Hypermedia Controls
- [ ] Full test coverage for HATEOAS / Hypermedia Controls
- [ ] Security review completed for HATEOAS / Hypermedia Controls
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for HATEOAS / Hypermedia Controls
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Standardize on a `_links` object structure at both resource and collection levels.
- [ ] Use consistent `rel` values (IANA Link Relations where applicable). Never change link `rel` values after release.
- [ ] HATEOAS links must use the correct base URL â€” set `APP_URL` to the API domain in production.
- [ ] Links from cached responses may point to deleted resources â€” clients must handle link staleness gracefully.
- [ ] Full HATEOAS (hypermedia-driven navigation) requires significantly more server complexity than pragmatic links. Start with self + pagination links.
- [ ] For collections, avoid per-item link generation that requires N+1 queries â€” eager load or batch compute.

---

# Implementation Checklist

- [ ] `self` link on every resource
- [ ] `related` links for relationships
- [ ] `action` links for available operations
- [ ] Pagination links on collections
- [ ] Links generated via `route()` helper
- [ ] Links conditional on authorization
- [ ] Absolute URLs
- [ ] Consistent relation names
- [ ] Documented link relations
- [ ] Link targets tested
- [ ] Implement HATEOAS / Hypermedia Controls following rest-api-design patterns
- [ ] Configure all required settings for HATEOAS / Hypermedia Controls
- [ ] Register route/middleware/service for HATEOAS / Hypermedia Controls
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Each link object adds ~50-100 bytes per response. For collections of 100 items with 4 links each: 20-40KB overhead.
- [ ] Conditional link computation based on authorization adds per-item processing â€” batch auth checks.
- [ ] Pagination link generation for large result sets (500+ pages) is wasteful â€” generate only first/prev/next/last.
- [ ] Link generation in resource `toArray()` adds serialization time â€” ~5-15ms for 100-item collections.

---

# Security Checklist

- [ ] State-driven links must respect authorization â€” never include links to actions the current client cannot perform.
- [ ] Links must not expose internal server hostnames, IP addresses, or non-public endpoints.
- [ ] `self` link URLs should use HTTPS and the public-facing API domain.
- [ ] Authorization claims used for link computation must be re-validated when the link is followed (authorization may change between response and action).

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Every resource response includes a `self` link with correct `href` and `method`.
- [ ] Paginated collection responses include `self`, `first`, `prev`, `next`, `last` links.
- [ ] Links change based on resource state (e.g., deleted resources show `restore`, not `update`).
- [ ] All links use `route()` helper with named routes â€” no hardcoded URL strings.
- [ ] Links are computed using authorization checks â€” unauthorized actions are not linked.
- [ ] API root endpoint (`GET /api`) returns links to all available entry points.
- [ ] Write feature tests for happy path of HATEOAS / Hypermedia Controls
- [ ] Write feature tests for validation failure of HATEOAS / Hypermedia Controls
- [ ] Write feature tests for authentication failure of HATEOAS / Hypermedia Controls
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

- [ ] Avoid: Full HATEOAS Without Client Buy-In
- [ ] Avoid: Links on Every Response Without Consideration
- [ ] Avoid: Hardcoded href Values
- [ ] Avoid: Authorization in Links
- [ ] Avoid: Resource Links Without Method

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
- Always Include Self Link On Every Resource
- Only Include Actionable Links
- Use Named Routes With route() Helper For Link Generation
- Generate Only First/Prev/Next/Last For Pagination Links
- Batch Authorization Checks For Collection Link Generation
- Include Method In Every Link Object
- Include API Root Links For Discoverability
- Use Consistent Link Rel Values Across The API

### Anti-Patterns
- Full HATEOAS Without Client Buy-In
- Links on Every Response Without Consideration
- Hardcoded href Values
- Authorization in Links
- Resource Links Without Method

## Related Knowledge
- Prerequisites
- Related
- Advanced



