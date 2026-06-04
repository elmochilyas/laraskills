# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Deprecation Header Implementation
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Deprecation Header Implementation implementation follows api-versioning patterns
- [ ] All edge cases handled for Deprecation Header Implementation
- [ ] Full test coverage for Deprecation Header Implementation
- [ ] Security review completed for Deprecation Header Implementation
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Deprecation Header Implementation
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Header injection adds ~0.01ms per deprecated response â€” negligible.
- [ ] Config array lookup is O(1) â€” no performance concern.
- [ ] Deprecation middleware is added to deprecated version route groups, not to individual routes.
- [ ] Per-endpoint deprecation uses route attributes or a separate config map.
- [ ] Response body deprecation field adds bytes to every deprecated response.

---

# Implementation Checklist

- [ ] Middleware applied to deprecated route groups, not individual controllers
- [ ] `Deprecation: true` header on all deprecated responses
- [ ] `since` parameter with ISO 8601 date included
- [ ] Paired with `Sunset` header with removal date (RFC 7231 format)
- [ ] `Link` header with migration guide URL
- [ ] Standard RFC 9745 header names used
- [ ] Deprecated endpoints still function correctly
- [ ] Deprecation header deliveries logged for migration tracking
- [ ] CI tests verify deprecated endpoint headers
- [ ] Implement Deprecation Header Implementation following api-versioning patterns
- [ ] Configure all required settings for Deprecation Header Implementation
- [ ] Register route/middleware/service for Deprecation Header Implementation
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Header injection adds ~0.01ms per deprecated response.
- [ ] Config array lookup is O(1) â€” no performance concern.
- [ ] Response body deprecation field adds a small amount of bandwidth per deprecated response.

---

# Security Checklist

- [ ] Deprecated versions may have known vulnerabilities â€” ensure they still maintain auth/authorization.
- [ ] Never deprecate a version without an alternative that maintains security standards.
- [ ] Monitor that consumers don't "ignore" deprecation headers and continue using unpatched old versions.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Deprecation middleware implemented and applied to deprecated route groups
- [ ] `Deprecation: true` header present on all deprecated responses
- [ ] `since` parameter included with ISO 8601 date
- [ ] Paired with `Sunset` header with removal date
- [ ] Paired with `Link` header pointing to migration guide
- [ ] Deprecated endpoints still function correctly (deprecation â‰  broken)
- [ ] Deprecation frequency monitored for consumer migration tracking
- [ ] Write feature tests for happy path of Deprecation Header Implementation
- [ ] Write feature tests for validation failure of Deprecation Header Implementation
- [ ] Write feature tests for authentication failure of Deprecation Header Implementation
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

- [ ] Avoid: Header Fatigue
- [ ] Avoid: Silent Deprecation
- [ ] Avoid: Deprecation Without Alternative
- [ ] Avoid: Missing Sunset Pair
- [ ] Avoid: Non-Standard Header Names

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
- Always Use Middleware For Header Injection
- Use RFC 9745 Standard Header Names
- Pair Deprecation With Sunset Header Always
- Include `since` Parameter With ISO 8601 Date
- Keep Deprecated Endpoints Fully Functional
- Test Deprecated Endpoints In CI
- Monitor Deprecation Header Frequency

### Anti-Patterns
- Header Fatigue
- Silent Deprecation
- Deprecation Without Alternative
- Missing Sunset Pair
- Non-Standard Header Names

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



