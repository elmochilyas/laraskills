# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mocking & Fakes
**Knowledge Unit:** HTTP Client Faking
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always call `Http::fake()` before any HTTP-dependent code
- [ ] Apply rule: Use URL pattern matching with wildcards
- [ ] Apply rule: Test each error response path with faked error codes
- [ ] Apply rule: Use `assertSent()` to verify request content
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `Http::fake()` is called before any HTTP requests are made
- [ ] URL patterns use wildcards for dynamic segments
- [ ] Response status codes and body match expected API contract
- [ ] Error scenarios (500, timeout, 429) are tested
- [ ] Sequential responses are used for retry logic testing
- [ ] Avoid: Mistake
- [ ] Avoid: Forgetting to call `Http::fake()`
- [ ] Avoid: Not matching URL patterns correctly

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Stub vs assert**: Use URL-specific faking for response stubbing. Use `assertSent()` for request verification. Don't rely on `assertSent()` to validate response handling.
- **Wildcard vs exact URL**: Use exact URLs for critical endpoints. Use wildcards for many-endpoint integrations.
- **`Http::fake()` vs `Http::fakeSequence()`**: URL patterns for most cases. Sequences for multi-response flows.
- **Prevent stray requests**: Global catch-all `Http::fake()` without URL argument ensures no unexpected HTTP calls.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always call `Http::fake()` before any HTTP-dependent code
- [ ] Follow rule: Use URL pattern matching with wildcards
- [ ] Follow rule: Test each error response path with faked error codes
- [ ] Follow rule: Use `assertSent()` to verify request content
- [ ] Follow rule: Use a catch-all pattern to prevent unexpected HTTP requests
- [ ] Follow rule: Use `Http::sequence()` for multi-response flows (polling, retries)
- [ ] - [ ] `Http::fake()` is called before any HTTP requests are made
- [ ] - [ ] URL patterns use wildcards for dynamic segments
- [ ] - [ ] Response status codes and body match expected API contract
- [ ] - [ ] Error scenarios (500, timeout, 429) are tested

# Performance Checklist
- Fake registration: <0.5ms.
- Response delivery: <0.01ms per request.
- Request recording: <0.01ms per request.
- Assertion execution: <0.1ms per assertion.

# Security Checklist
- Ensure fake API responses don't contain real secrets or credentials. Use placeholder values.
- API keys and tokens in requests should be verified as sent correctly, not stored in test code.
- Test that error responses don't leak internal API credentials or configuration.

# Reliability Checklist
- [ ] Ensure: Laravel's `Http::fake()` method intercepts outgoing HTTP requests made via the `...
- [ ] Verify: Always call `Http::fake()` before any HTTP-dependent code
- [ ] Verify: Use URL pattern matching with wildcards
- [ ] Verify: Test each error response path with faked error codes
- [ ] Verify: Use `assertSent()` to verify request content

# Testing Checklist
- [ ] `Http::fake()` is called before any HTTP requests are made
- [ ] URL patterns use wildcards for dynamic segments
- [ ] Response status codes and body match expected API contract
- [ ] Error scenarios (500, timeout, 429) are tested
- [ ] Sequential responses are used for retry logic testing
- [ ] Request assertions verify correct URL, headers, and body
- [ ] Avoid: Mistake
- [ ] Avoid: Forgetting to call `Http::fake()`
- [ ] Avoid: Not matching URL patterns correctly

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always call `Http::fake()` before any HTTP-dependent code
- [ ] Apply: Use URL pattern matching with wildcards
- [ ] Apply: Test each error response path with faked error codes
- [ ] Apply: Use `assertSent()` to verify request content

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Forgetting to call `Http::fake()`
- [ ] Avoid mistake: Not matching URL patterns correctly
- [ ] Avoid mistake: Using `assertSent` without faking first
- [ ] Avoid mistake: Not testing error responses

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
- Always call `Http::fake()` before any HTTP-dependent code
- Use URL pattern matching with wildcards
- Test each error response path with faked error codes
- Use `assertSent()` to verify request content
- Use a catch-all pattern to prevent unexpected HTTP requests
- Use `Http::sequence()` for multi-response flows (polling, retries)
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Fake HTTP Client Requests in Tests


