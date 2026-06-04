# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Header-Based Versioning
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Header-Based Versioning implementation follows api-versioning patterns
- [ ] All edge cases handled for Header-Based Versioning
- [ ] Full test coverage for Header-Based Versioning
- [ ] Security review completed for Header-Based Versioning
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Header-Based Versioning
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Header parsing adds ~0.05ms per request â€” negligible.
- [ ] Controller factory resolution must be cached or use singleton pattern to avoid per-request overhead.
- [ ] The primary operational risk is invisibility â€” when something breaks, you can't see the version in the URL.
- [ ] Proxy/gateway compatibility must be verified â€” corporate proxies may strip custom headers.

---

# Implementation Checklist

- [ ] Header name chosen and documented
- [ ] Middleware reads version from header
- [ ] Validates format â€” major version integer
- [ ] Default version when header missing
- [ ] 400 for invalid format
- [ ] Version attached to request attributes
- [ ] Version header echoed in response
- [ ] `Vary` header set for cache coherence
- [ ] Header version usage logged
- [ ] Tests cover missing, valid, invalid header values
- [ ] Implement Header-Based Versioning following api-versioning patterns
- [ ] Configure all required settings for Header-Based Versioning
- [ ] Register route/middleware/service for Header-Based Versioning
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Header parsing adds ~0.05ms per request â€” negligible.
- [ ] `Vary: Accept` splits the cache into N partitions (one per version), reducing effective cache size.
- [ ] Response header (`X-API-Version`) injection adds ~0.01ms.
- [ ] Gateway-level header parsing is faster than application-level.

---

# Security Checklist

- [ ] Test that security monitoring tools can still identify API version from headers.
- [ ] Ensure version header parsing doesn't introduce injection vulnerabilities in middleware.
- [ ] A missing Accept header should fail safely (default to latest or return 406), not crash.
- [ ] Corporate proxies that strip custom `X-API-Version` headers leave all clients at the default version.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Version resolution middleware implemented and tested
- [ ] `Vary: Accept` header set on all versioned responses
- [ ] Resolved version included in response headers
- [ ] Invalid/unsupported versions return 406
- [ ] Proxy/gateway compatibility verified
- [ ] Dashboard tracking distribution of versions served
- [ ] Write feature tests for happy path of Header-Based Versioning
- [ ] Write feature tests for validation failure of Header-Based Versioning
- [ ] Write feature tests for authentication failure of Header-Based Versioning
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

- [ ] Avoid: Silent Defaulting
- [ ] Avoid: No Response Version Header
- [ ] Avoid: Proxy Dependency
- [ ] Avoid: Missing Vary Header
- [ ] Avoid: Strict Regex Rejection

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
- Use Middleware For Version Resolution
- Set `Vary: Accept` On All Versioned Responses
- Include Resolved Version In Response Headers
- Validate Unsupported Versions With 406
- Log Both Raw And Resolved Version
- Test Header Parsing With Invalid Inputs
- Verify Proxy/Gateway Does Not Strip Custom Headers
- Provide A `/version` Endpoint For Client Debugging

### Anti-Patterns
- Silent Defaulting
- No Response Version Header
- Proxy Dependency
- Missing Vary Header
- Strict Regex Rejection

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



