# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** api-versioning
**Knowledge Unit:** Form Request Organization
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Form Request Organization implementation follows api-versioning patterns
- [ ] All edge cases handled for Form Request Organization
- [ ] Full test coverage for Form Request Organization
- [ ] Security review completed for Form Request Organization
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Form Request Organization
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Form request resolution adds ~0.2ms per request â€” negligible.
- [ ] Rule inheritance adds no runtime cost (rules are arrays built at call time).
- [ ] Complex `prepareForValidation()` logic can add measurable overhead â€” keep it light.
- [ ] Rule caching (Laravel 11) applies per request class, not per version.
- [ ] Authorization drift prevention: ensure V2 doesn't remove checks present in V1 without intentional review.

---

# Implementation Checklist

- [ ] Versioned namespaces used for form requests
- [ ] Rule inheritance pattern used for progressive enhancement
- [ ] `validated()` used instead of `all()`
- [ ] Authorization checks not weakened in newer versions
- [ ] Deprecated fields marked `nullable|sometimes`
- [ ] Each version's form request tested independently
- [ ] No authorization gaps between versions
- [ ] Implement Form Request Organization following api-versioning patterns
- [ ] Configure all required settings for Form Request Organization
- [ ] Register route/middleware/service for Form Request Organization
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Form request resolution adds ~0.2ms per request.
- [ ] Rule inheritance adds no runtime cost (rules are arrays built at call time).
- [ ] Complex `prepareForValidation()` can add overhead â€” keep it light.
- [ ] Rule validation caching applies per request class, not per version.

---

# Security Checklist

- [ ] Form request versioning is the most security-critical aspect of API versioning â€” a rule gap between versions is a vulnerability.
- [ ] V2 must not remove `authorize()` checks that existed in V1 without intentional review.
- [ ] Security-critical validation rules should be tested for every active version.
- [ ] OWASP API Security emphasizes the risk of authorization drift between API versions.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Version-specific form requests in versioned namespaces
- [ ] Rule inheritance pattern used for progressive enhancement
- [ ] Each version's rules tested independently (not relying on parent tests)
- [ ] Authorization logic tested per version
- [ ] Rule diff tracked between versions
- [ ] Deprecated fields marked as `nullable|sometimes` in older versions
- [ ] No authorization gaps between versions
- [ ] Write feature tests for happy path of Form Request Organization
- [ ] Write feature tests for validation failure of Form Request Organization
- [ ] Write feature tests for authentication failure of Form Request Organization
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

- [ ] Avoid: Rule Leak
- [ ] Avoid: Authorization Gap
- [ ] Avoid: Silent Rule Removal
- [ ] Avoid: Same Request for Store and Update
- [ ] Avoid: Modifying Parent Rules Directly

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
- Use Versioned Namespace For Form Requests
- Override `rules()` By Extending Parent, Not Modifying In Place
- Use `validated()` Instead Of `$request->all()`
- Test Each Version's Form Request Independently
- Mark Deprecated Fields As `nullable|sometimes` In Newer Versions
- Never Remove `authorize()` Checks In Newer Versions
- Use Traits For Reusable Rule Groups
- Include Version Number In Error Responses

### Anti-Patterns
- Rule Leak
- Authorization Gap
- Silent Rule Removal
- Same Request for Store and Update
- Modifying Parent Rules Directly

## Related Knowledge
- Prerequisites
- Siblings
- Advanced



