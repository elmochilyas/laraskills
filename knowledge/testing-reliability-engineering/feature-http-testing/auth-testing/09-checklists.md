# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** Authentication & Authorization Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Test every side of every authorization boundary
- [ ] Apply rule: Use `actingAs()` for authorization tests, actual POST for login flow tests
- [ ] Apply rule: Test authorization for every HTTP verb on every resource
- [ ] Apply rule: Test ownership boundaries for user-scoped resources
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Every protected endpoint tests guest access rejection
- [ ] Authorization tested for all HTTP verbs on every resource
- [ ] Ownership boundaries tested (User A cannot access User B's data)
- [ ] Role-based access matrix tested for all roles
- [ ] Login flow tested with actual POST (wrong password, lockout, CSRF)
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing authenticated access (not guest)
- [ ] Avoid: Using actingAs() for login flow testing

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`actingAs()` vs full login flow**: `actingAs()` for authorization tests (fast, focused). Full login flow for authentication tests (thorough, slow).
- **Sanctum vs session auth**: Sanctum uses `actingAsSanctum()` and token assertions. Session uses `actingAs()` and redirect assertions.
- **Policy unit tests vs HTTP tests**: Unit-test policies for logic correctness. HTTP-test policies for middleware integration.
- **Multi-tenant auth**: Test that users from Tenant A cannot access Tenant B's data.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Test every side of every authorization boundary
- [ ] Follow rule: Use `actingAs()` for authorization tests, actual POST for login flow tests
- [ ] Follow rule: Test authorization for every HTTP verb on every resource
- [ ] Follow rule: Test ownership boundaries for user-scoped resources
- [ ] Follow rule: Use `actingAsSanctum()` for Sanctum-guarded API routes
- [ ] Follow rule: Test rate limiting on authentication endpoints
- [ ] - [ ] Every protected endpoint tests guest access rejection
- [ ] - [ ] Authorization tested for all HTTP verbs on every resource
- [ ] - [ ] Ownership boundaries tested (User A cannot access User B's data)
- [ ] - [ ] Role-based access matrix tested for all roles

# Performance Checklist
- `actingAs()` overhead: <1ms. Sets user in session without DB query.
- Full login flow: ~10-15ms per test (password verification, session creation, CSRF).
- Policy resolution: ~1-2ms per check. Cached by Laravel.
- Role/permission checks: Spatie Permission caches roles/permissions per request.

# Security Checklist
- Authorization testing is security-critical. Gaps here mean unauthorized data access in production.
- Test that error responses don't reveal whether a resource exists (use 404 for both "not found" and "not authorized" in some contexts).
- Test rate limiting on auth endpoints (login, register, password reset).
- Test brute force protection (account lockout after N failed attempts).

# Reliability Checklist
- [ ] Ensure: Authentication testing verifies login, registration, password reset, and session...
- [ ] Verify: Test every side of every authorization boundary
- [ ] Verify: Use `actingAs()` for authorization tests, actual POST for login flow tests
- [ ] Verify: Test authorization for every HTTP verb on every resource
- [ ] Verify: Test ownership boundaries for user-scoped resources

# Testing Checklist
- [ ] Every protected endpoint tests guest access rejection
- [ ] Authorization tested for all HTTP verbs on every resource
- [ ] Ownership boundaries tested (User A cannot access User B's data)
- [ ] Role-based access matrix tested for all roles
- [ ] Login flow tested with actual POST (wrong password, lockout, CSRF)
- [ ] Correct guard helper used (actingAs vs actingAsSanctum)
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing authenticated access (not guest)
- [ ] Avoid: Using actingAs() for login flow testing

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Test every side of every authorization boundary
- [ ] Apply: Use `actingAs()` for authorization tests, actual POST for login flow tests
- [ ] Apply: Test authorization for every HTTP verb on every resource
- [ ] Apply: Test ownership boundaries for user-scoped resources

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only testing authenticated access (not guest)
- [ ] Avoid mistake: Using actingAs() for login flow testing
- [ ] Avoid mistake: Not testing authorization for all HTTP verbs
- [ ] Avoid mistake: Guard mismatch

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Test every side of every authorization boundary
- Use `actingAs()` for authorization tests, actual POST for login flow tests
- Test authorization for every HTTP verb on every resource
- Test ownership boundaries for user-scoped resources
- Use `actingAsSanctum()` for Sanctum-guarded API routes
- Test rate limiting on authentication endpoints
- Test that error responses do not reveal whether a resource exists
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Authentication and Authorization Boundaries


