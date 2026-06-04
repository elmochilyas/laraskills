# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** HTTP Test Helpers
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always use named routes in HTTP tests
- [ ] Apply rule: Never use `withoutMiddleware()` in feature tests
- [ ] Apply rule: Test both success and error responses for every endpoint
- [ ] Apply rule: Use `getJson()`/`postJson()` for API routes and `get()`/`post()` for web routes
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Feature tests use named routes, not hardcoded URLs
- [ ] Error responses (404, 403, 422, 500) tested per endpoint
- [ ] `actingAs()` used for authenticated endpoints
- [ ] `withoutMiddleware()` not used in feature tests
- [ ] Tests follow Arrange-Act-Assert structure
- [ ] Avoid: Mistake
- [ ] Avoid: Using withoutMiddleware() in feature tests
- [ ] Avoid: Not testing error responses

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`get()` vs `getJson()`**: Use `getJson()` for API routes (JSON responses). Use `get()` for web routes (HTML/Blade responses).
- **`post()` vs `postJson()`**: `post()` uses `application/x-www-form-urlencoded`. `postJson()` uses `application/json`.
- **Organize by feature, not by type**: `tests/Feature/Users/`, `tests/Feature/Orders/` â€” makes discovery and CI filtering natural.
- **Parallel execution**: HTTP tests benefit significantly from parallel execution (I/O-bound: database, view rendering).

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always use named routes in HTTP tests
- [ ] Follow rule: Never use `withoutMiddleware()` in feature tests
- [ ] Follow rule: Test both success and error responses for every endpoint
- [ ] Follow rule: Use `getJson()`/`postJson()` for API routes and `get()`/`post()` for web routes
- [ ] Follow rule: Follow Arrange-Act-Assert structure in every test
- [ ] Follow rule: Don't use `withoutCSRF()` â€” include CSRF tokens or test with middleware active
- [ ] - [ ] Feature tests use named routes, not hardcoded URLs
- [ ] - [ ] Error responses (404, 403, 422, 500) tested per endpoint
- [ ] - [ ] `actingAs()` used for authenticated endpoints
- [ ] - [ ] `withoutMiddleware()` not used in feature tests

# Performance Checklist
- Application boot overhead: ~30ms per HTTP test. 100 tests = ~3 seconds booting.
- Database operations with RefreshDatabase: <1ms transaction overhead per test.
- Middleware impact: Heavy middleware adds overhead. Disable non-essential middleware in testing environment.
- Response parsing: `assertSee()` and HTML parsing are slower than JSON assertions.

# Security Checklist
- HTTP tests simulate requests â€” they don't actually make network calls.
- CSRF protection is active by default. Use `$this->withoutCSRF()` to disable for testing, or include CSRF token in requests.
- Rate limiting is active in tests. Use `$this->withoutMiddleware(ThrottleRequests::class)` if rate limiting interferes with test scenarios.

# Reliability Checklist
- [ ] Ensure: Laravel's HTTP test helpers simulate full HTTP requests (GET, POST, PUT, PATCH, ...
- [ ] Verify: Always use named routes in HTTP tests
- [ ] Verify: Never use `withoutMiddleware()` in feature tests
- [ ] Verify: Test both success and error responses for every endpoint
- [ ] Verify: Use `getJson()`/`postJson()` for API routes and `get()`/`post()` for web routes

# Testing Checklist
- [ ] Feature tests use named routes, not hardcoded URLs
- [ ] Error responses (404, 403, 422, 500) tested per endpoint
- [ ] `actingAs()` used for authenticated endpoints
- [ ] `withoutMiddleware()` not used in feature tests
- [ ] Tests follow Arrange-Act-Assert structure
- [ ] `getJson()`/`postJson()` for API routes, `get()`/`post()` for web routes
- [ ] Avoid: Mistake
- [ ] Avoid: Using withoutMiddleware() in feature tests
- [ ] Avoid: Not testing error responses

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always use named routes in HTTP tests
- [ ] Apply: Never use `withoutMiddleware()` in feature tests
- [ ] Apply: Test both success and error responses for every endpoint
- [ ] Apply: Use `getJson()`/`postJson()` for API routes and `get()`/`post()` for web routes

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Using withoutMiddleware() in feature tests
- [ ] Avoid mistake: Not testing error responses
- [ ] Avoid mistake: Hardcoded URLs instead of named routes
- [ ] Avoid mistake: Not using actingAs() for auth

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
- Always use named routes in HTTP tests
- Never use `withoutMiddleware()` in feature tests
- Test both success and error responses for every endpoint
- Use `getJson()`/`postJson()` for API routes and `get()`/`post()` for web routes
- Follow Arrange-Act-Assert structure in every test
- Don't use `withoutCSRF()` â€” include CSRF tokens or test with middleware active
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Write Feature Tests with HTTP Helpers


