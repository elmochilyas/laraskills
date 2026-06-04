# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Deprecation Link Headers
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Deprecation Link Headers implementation follows api-versioning patterns
- [ ] All edge cases handled for Deprecation Link Headers
- [ ] Full test coverage for Deprecation Link Headers
- [ ] Security review completed for Deprecation Link Headers
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Deprecation Link Headers
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Link headers add ~50-200 bytes per deprecated response â€” negligible.
- [ ] Link target URLs should be stable and permanent (only add, never remove or change).
- [ ] A deprecation link header is a promise that the linked resource will exist for the entire deprecation period.
- [ ] Use analytics redirect (`302 â†’ migration URL`) for click tracking if consumer engagement measurement is needed.

---

# Implementation Checklist

- [ ] `Link` header with `rel="deprecation"` present on deprecated responses
- [ ] `Link` header with `rel="alternate"` pointing to new version
- [ ] Absolute URLs used in all link headers
- [ ] Links sent as separate headers, not comma-separated
- [ ] Link targets return 200 with migration guidance
- [ ] Link health check runs on schedule
- [ ] Links included in error responses for deprecated endpoints
- [ ] Implement Deprecation Link Headers following api-versioning patterns
- [ ] Configure all required settings for Deprecation Link Headers
- [ ] Register route/middleware/service for Deprecation Link Headers
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Link headers add ~50-200 bytes per deprecated response.
- [ ] Parse overhead is zero (header injection at framework level).
- [ ] Link health checks run offline â€” no production cost.
- [ ] Analytics redirect adds ~5ms per follow (one-time per consumer).

---

# Security Checklist

- [ ] Ensure link targets don't point to external/untrusted domains without validation.
- [ ] Analytics redirects should not leak API keys or consumer identifiers in the redirect URL.
- [ ] Migration guide URLs should be served over HTTPS.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] `Link` header with `rel="deprecation"` present on all deprecated responses
- [ ] `Link` header with `rel="alternate"` pointing to the new version
- [ ] Link targets return 200 and contain migration guidance
- [ ] Link health check runs on a schedule
- [ ] Absolute URLs used in link headers
- [ ] Links included in error responses for deprecated endpoints (410, 406)
- [ ] Write feature tests for happy path of Deprecation Link Headers
- [ ] Write feature tests for validation failure of Deprecation Link Headers
- [ ] Write feature tests for authentication failure of Deprecation Link Headers
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

- [ ] Avoid: Broken Link
- [ ] Avoid: No Alternative URL
- [ ] Avoid: Link Rot
- [ ] Avoid: Non-Standard Relation Type
- [ ] Avoid: Relative URLs

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
- Always Include `rel="deprecation"` Link On Deprecated Endpoints
- Use Absolute URLs In Link Headers
- Include Both Deprecation And Alternate Links
- Test Link Target Health Periodically
- Send Multiple Links As Separate Headers Not Comma-Separated
- Use Standard Relation Types Only
- Include Links In Error Responses For Deprecated Endpoints

### Anti-Patterns
- Broken Link
- No Alternative URL
- Link Rot
- Non-Standard Relation Type
- Relative URLs

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



