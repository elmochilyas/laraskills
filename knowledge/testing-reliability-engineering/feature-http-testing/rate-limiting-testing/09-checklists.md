# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** Rate Limiting Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use the three-phase pattern: within limit â†’ exceed limit â†’ after decay
- [ ] Apply rule: Use time manipulation, never `sleep()` or real waits
- [ ] Apply rule: Test key isolation â€” different users must have independent rate limit counters
- [ ] Apply rule: Use `array` cache driver for rate limit tests
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `array` cache driver used in testing environment
- [ ] Three-phase pattern: within limit, exceed, after decay
- [ ] Key isolation tested (different users have independent limits)
- [ ] `X-RateLimit-*` headers verified
- [ ] Named limiters used (not inline limits)
- [ ] Avoid: Mistake
- [ ] Avoid: Testing without time reset
- [ ] Avoid: Inline rate limiter definitions (not named)

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Cache driver**: Use `array` in testing for speed and isolation. Redis/memcached in production.
- **Time manipulation**: `travel($decaySeconds + 1)->seconds()` after exceeding the limit. Always reset time in `afterEach()` or `tearDown()`.
- **Named limiters**: Define in `App\Providers\AppServiceProvider` or `RouteServiceProvider`. Reference by name in middleware and tests.
- **Global vs endpoint-specific limits**: Test separately. They have different keys and limits.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use the three-phase pattern: within limit â†’ exceed limit â†’ after decay
- [ ] Follow rule: Use time manipulation, never `sleep()` or real waits
- [ ] Follow rule: Test key isolation â€” different users must have independent rate limit counters
- [ ] Follow rule: Use `array` cache driver for rate limit tests
- [ ] Follow rule: Always reset test time in teardown
- [ ] Follow rule: Use named rate limiters (not inline limits) for testability
- [ ] - [ ] `array` cache driver used in testing environment
- [ ] - [ ] Three-phase pattern: within limit, exceed, after decay
- [ ] - [ ] Key isolation tested (different users have independent limits)
- [ ] - [ ] `X-RateLimit-*` headers verified

# Performance Checklist
- Rate limiter cache check: <1ms per request with `array` driver.
- Sequential request testing: 60 requests at ~30ms each = ~1.8s for burst test.
- Time manipulation: No performance cost. Pure PHP time mocking.
- Always use `array` cache driver; `file` is 2-3x slower.

# Security Checklist
- Rate limiting is a critical DoS protection boundary. Untested rate limits mean abuse vulnerability.
- Login rate limiting: Block after N failed attempts. Test lockout and reset after lockout period.
- Test that error responses don't reveal rate limit thresholds (use consistent 429 messages).
- Multi-tenant rate limits: Test that Tenant A cannot exhaust Tenant B's limit.

# Reliability Checklist
- [ ] Ensure: Rate limiting testing verifies that API endpoints and web routes correctly enfor...
- [ ] Verify: Use the three-phase pattern: within limit â†’ exceed limit â†’ after decay
- [ ] Verify: Use time manipulation, never `sleep()` or real waits
- [ ] Verify: Test key isolation â€” different users must have independent rate limit counters
- [ ] Verify: Use `array` cache driver for rate limit tests

# Testing Checklist
- [ ] `array` cache driver used in testing environment
- [ ] Three-phase pattern: within limit, exceed, after decay
- [ ] Key isolation tested (different users have independent limits)
- [ ] `X-RateLimit-*` headers verified
- [ ] Named limiters used (not inline limits)
- [ ] `travel()` used for time manipulation (no `sleep()`)
- [ ] Avoid: Mistake
- [ ] Avoid: Testing without time reset
- [ ] Avoid: Inline rate limiter definitions (not named)

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use the three-phase pattern: within limit â†’ exceed limit â†’ after decay
- [ ] Apply: Use time manipulation, never `sleep()` or real waits
- [ ] Apply: Test key isolation â€” different users must have independent rate limit counters
- [ ] Apply: Use `array` cache driver for rate limit tests

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Testing without time reset
- [ ] Avoid mistake: Inline rate limiter definitions (not named)
- [ ] Avoid mistake: Not testing with different keys
- [ ] Avoid mistake: Using real time waits

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
- Use the three-phase pattern: within limit â†’ exceed limit â†’ after decay
- Use time manipulation, never `sleep()` or real waits
- Test key isolation â€” different users must have independent rate limit counters
- Use `array` cache driver for rate limit tests
- Always reset test time in teardown
- Use named rate limiters (not inline limits) for testability
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Rate Limiting with Three-Phase Pattern


